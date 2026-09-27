import type { AuthResponse, AuthUser, LoginPayload, RegisterPayload } from './types';

/** A login the API refused, carrying the reason code it sent back (#001). */
export class LoginError extends Error {
  constructor(
    message: string,
    readonly code?: string
  ) {
    super(message);
    this.name = 'LoginError';
  }
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new LoginError(error.message || 'Đăng nhập thất bại', error?.errors?.email);
  }

  return res.json();
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Registration failed');
  }

  return res.json();
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' });
}

export async function getMe(): Promise<AuthUser> {
  const res = await fetch('/api/auth/me');

  if (!res.ok) {
    throw new Error('Not authenticated');
  }

  return res.json();
}

/** Change the signed-in staff member's own password (#066). */
export async function changePassword(payload: {
  oldPassword: string;
  password: string;
}): Promise<void> {
  const res = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    // The API reports a wrong current password as a field error.
    const field = error?.errors?.oldPassword;
    if (field === 'incorrectOldPassword') {
      throw new Error('Mật khẩu hiện tại không đúng');
    }
    throw new Error(error.message || 'Đổi mật khẩu thất bại');
  }
}

/** The address change waiting to be confirmed, and which step it is on (#031). */
export type PendingEmailChange = {
  email: string | null;
  stage: string | null;
};

async function emailChangeStep(
  step: 'request' | 'verify-current' | 'confirm',
  payload: Record<string, unknown>
): Promise<unknown> {
  const res = await fetch('/api/auth/email-change', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ step, ...payload })
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Không thực hiện được yêu cầu.');
  }

  return res.json().catch(() => ({}));
}

export async function getPendingEmailChange(): Promise<PendingEmailChange | null> {
  const res = await fetch('/api/auth/email-change');
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

/** Step one: mail a code to the address currently on the account. */
export async function requestEmailChange(email: string): Promise<void> {
  await emailChangeStep('request', { email });
}

/** Step two: prove the current address, which sends a code to the new one. */
export async function verifyCurrentEmailCode(code: string): Promise<void> {
  await emailChangeStep('verify-current', { code });
}

/** Step three: the code from the new address moves the account over. */
export async function confirmEmailChange(email: string, code: string): Promise<void> {
  await emailChangeStep('confirm', { email, code });
}
