// ============================================================
// User Service — Data Access Layer
// ============================================================
// All endpoints proxy through Next.js route handlers (BFF pattern)
// to the NestJS backend at API_URL/api/v1/users.
//
// Route handlers: src/app/api/users/route.ts (list + create)
//                 src/app/api/users/[id]/route.ts (get + update + delete)
// ============================================================

import { apiClient } from '@/lib/api-client';
import type {
  User,
  UserFilters,
  UsersResponse,
  CreateUserPayload,
  UpdateUserPayload
} from './types';

export async function getUsers(filters: UserFilters): Promise<UsersResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.sort) params.set('sort', filters.sort);

  // Merge roleIds shortcut into the backend's `filters` JSON shape: { roles: [{ id }] }
  const explicitFilters = filters.filters ? safeParse(filters.filters) : undefined;
  const merged: Record<string, unknown> = { ...(explicitFilters ?? {}) };

  if (filters.roleIds && filters.roleIds.length > 0) {
    merged.roles = filters.roleIds.map((id) => ({ id }));
  }

  if (Object.keys(merged).length > 0) {
    params.set('filters', JSON.stringify(merged));
  }

  const query = params.toString();
  return apiClient<UsersResponse>(`/users${query ? `?${query}` : ''}`);
}

function safeParse(raw: string): Record<string, unknown> | undefined {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}

export async function getUser(id: number): Promise<User> {
  return apiClient<User>(`/users/${id}`);
}

export async function createUser(data: CreateUserPayload): Promise<User> {
  return apiClient<User>('/users', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateUser(id: number, data: UpdateUserPayload): Promise<User> {
  return apiClient<User>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function deleteUser(id: number): Promise<void> {
  await apiClient(`/users/${id}`, {
    method: 'DELETE'
  });
}
