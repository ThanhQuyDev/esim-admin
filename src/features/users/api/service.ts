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
  if (filters.filters) params.set('filters', filters.filters);
  if (filters.sort) params.set('sort', filters.sort);

  const query = params.toString();
  return apiClient<UsersResponse>(`/users${query ? `?${query}` : ''}`);
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
