import { askSalesPassword, isSalesPasswordReason } from './sales-password-prompt';
import { SALES_PASSWORD_HEADER } from './sales-password-header';

function getBaseUrl() {
  if (typeof window !== 'undefined') return '/api';
  // Server-side (RSC prefetch) needs an absolute URL. On Vercel there is no
  // localhost listener inside the function, so fall back to VERCEL_URL before
  // the local dev default — otherwise every prefetch would ECONNREFUSED.
  if (process.env.NEXT_PUBLIC_APP_URL) return `${process.env.NEXT_PUBLIC_APP_URL}/api`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}/api`;
  return `http://localhost:${process.env.PORT || 3000}/api`;
}

/**
 * An API failure, carrying the per-field errors the backend sent.
 *
 * A 422 from the backend is `{ status, errors: { field: code } }` with no
 * `message` at all, so throwing a plain Error dropped the only useful part on
 * the floor: the partner registration form could say nothing but "API error
 * 422" to somebody whose email was already registered.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly errors?: Record<string, string>;

  constructor(message: string, status: number, errors?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

/**
 * The session cookie to forward on a server-side call, if any.
 *
 * During an RSC prefetch this module calls the app's own `/api/*` proxy over
 * HTTP, and that request carries no cookies unless we attach them. Without it
 * the proxy has no token, the backend answers 401, and the rejected prefetch
 * surfaces mid-stream as a 500 / React #419 on every listing page.
 */
async function serverCookieHeader(): Promise<Record<string, string>> {
  if (typeof window !== 'undefined') return {};
  try {
    const { cookies } = await import('next/headers');
    const token = (await cookies()).get('token')?.value;
    return token ? { Cookie: `token=${token}` } : {};
  } catch {
    // Outside a request scope (build time) there is no session to forward.
    return {};
  }
}

export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  let salesPassword: string | null = null;
  for (;;) {
    const res: Response = await fetch(`${getBaseUrl()}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(await serverCookieHeader()),
        ...(options?.headers as Record<string, string> | undefined),
        ...(salesPassword ? { [SALES_PASSWORD_HEADER]: salesPassword } : {})
      }
    });
    if (res.status === 403 && typeof window !== 'undefined') {
      // A money transaction wants the sales password (vande-1411 #004): ask,
      // then send the same request again with it. Cancel ends it here.
      const body: { message?: unknown; errors?: Record<string, string> } = await res
        .clone()
        .json()
        .catch(() => ({}));
      const reason: unknown = body?.errors?.salesPassword;
      if (isSalesPasswordReason(reason)) {
        const message = typeof body.message === 'string' ? body.message : '';
        const typed: string | null =
          reason === 'required' || reason === 'invalid'
            ? await askSalesPassword(reason, message)
            : (await askSalesPassword(reason, message), null);
        if (typed) {
          salesPassword = typed;
          continue;
        }
        throw new ApiError(
          reason === 'not_set' || reason === 'locked'
            ? message
            : 'Đã huỷ: chưa nhập mật khẩu bán hàng.',
          403,
          body.errors
        );
      }
    }
    return readResponse<T>(res);
  }
}

async function readResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const errors =
      body.errors && typeof body.errors === 'object'
        ? (body.errors as Record<string, string>)
        : undefined;
    // The portal proxy has already dropped a token the backend refused, so the
    // page behind it can only show errors now. Send the partner to sign in
    // again, saying why (doitac-1410 #004).
    if (res.status === 401 && errors?.session && typeof window !== 'undefined') {
      window.location.replace(`/auth/sign-in?reason=${encodeURIComponent(errors.session)}`);
    }
    // A 422 that names only a field still says why (doitac-3010 #016).
    const firstError = errors
      ? Object.values(errors).find((v) => typeof v === 'string' && v.includes(' '))
      : undefined;
    throw new ApiError(
      (typeof body.message === 'string' ? body.message : '') ||
        firstError ||
        `Thao tác không thành công (mã lỗi ${res.status}).`,
      res.status,
      errors
    );
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
