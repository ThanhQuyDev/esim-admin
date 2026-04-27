import { apiClient } from '@/lib/api-client';
import type {
  SeoConfig,
  SeoConfigFilters,
  SeoConfigsResponse,
  CreateSeoConfigPayload,
  UpdateSeoConfigPayload
} from './types';

export async function getSeoConfigs(filters: SeoConfigFilters): Promise<SeoConfigsResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.filters) params.set('filters', filters.filters);
  if (filters.sort) params.set('sort', filters.sort);

  const query = params.toString();
  return apiClient<SeoConfigsResponse>(`/seo-configs${query ? `?${query}` : ''}`);
}

export async function getSeoConfig(id: number): Promise<SeoConfig> {
  return apiClient<SeoConfig>(`/seo-configs/${id}`);
}

export async function createSeoConfig(data: CreateSeoConfigPayload): Promise<SeoConfig> {
  return apiClient<SeoConfig>('/seo-configs', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateSeoConfig(
  id: number,
  data: UpdateSeoConfigPayload
): Promise<SeoConfig> {
  return apiClient<SeoConfig>(`/seo-configs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function deleteSeoConfig(id: number): Promise<void> {
  await apiClient(`/seo-configs/${id}`, {
    method: 'DELETE'
  });
}
