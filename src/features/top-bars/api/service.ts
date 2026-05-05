import { apiClient } from '@/lib/api-client';
import type {
  TopBar,
  TopBarFilters,
  TopBarResponse,
  CreateTopBarPayload,
  UpdateTopBarPayload
} from './types';

export async function getTopBars(filters: TopBarFilters): Promise<TopBarResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.filters) params.set('filters', filters.filters);
  if (filters.sort) params.set('sort', filters.sort);
  const query = params.toString();
  return apiClient<TopBarResponse>(`/top-bars${query ? `?${query}` : ''}`);
}

export async function getTopBarById(id: string): Promise<TopBar> {
  return apiClient<TopBar>(`/top-bars/${id}`);
}

export async function createTopBar(data: CreateTopBarPayload): Promise<TopBar> {
  return apiClient<TopBar>('/top-bars', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateTopBar(id: string, data: UpdateTopBarPayload): Promise<TopBar> {
  return apiClient<TopBar>(`/top-bars/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteTopBar(id: string): Promise<void> {
  await apiClient(`/top-bars/${id}`, { method: 'DELETE' });
}
