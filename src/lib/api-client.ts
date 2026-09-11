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
  const res = await fetch(`${getBaseUrl()}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(await serverCookieHeader()),
      ...(options?.headers as Record<string, string> | undefined)
    }
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const errors =
      body.errors && typeof body.errors === 'object'
        ? (body.errors as Record<string, string>)
        : undefined;
    throw new ApiError(
      body.message || `API error: ${res.status} ${res.statusText}`,
      res.status,
      errors
    );
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
