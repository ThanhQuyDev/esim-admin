import type { AuthResponse, AuthUser, LoginPayload, RegisterPayload } from './types';

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Login failed');
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
