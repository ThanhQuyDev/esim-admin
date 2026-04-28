import { apiClient } from '@/lib/api-client';
import type {
  MiniTag,
  MiniTagFilters,
  MiniTagsResponse,
  CreateMiniTagPayload,
  UpdateMiniTagPayload
} from './types';

export async function getMiniTags(filters: MiniTagFilters): Promise<MiniTagsResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.filters) params.set('filters', filters.filters);
  if (filters.sort) params.set('sort', filters.sort);

  return apiClient<MiniTagsResponse>(`/mini-tags?${params}`);
}

export async function getMiniTag(id: number): Promise<MiniTag> {
  return apiClient<MiniTag>(`/mini-tags/${id}`);
}

export async function createMiniTag(data: CreateMiniTagPayload): Promise<MiniTag> {
  return apiClient<MiniTag>('/mini-tags', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateMiniTag(id: number, data: UpdateMiniTagPayload): Promise<MiniTag> {
  return apiClient<MiniTag>(`/mini-tags/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function deleteMiniTag(id: number): Promise<void> {
  await apiClient<void>(`/mini-tags/${id}`, { method: 'DELETE' });
}
