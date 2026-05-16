import { apiClient } from '@/lib/api-client';
import type {
  HeroBanner,
  HeroBannerFilters,
  HeroBannerResponse,
  CreateHeroBannerPayload,
  UpdateHeroBannerPayload
} from './types';

export async function getHeroBanners(filters: HeroBannerFilters): Promise<HeroBannerResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.filters) params.set('filters', filters.filters);
  if (filters.sort) params.set('sort', filters.sort);
  const query = params.toString();
  return apiClient<HeroBannerResponse>(`/hero-banners${query ? `?${query}` : ''}`);
}

export async function getHeroBannerById(id: string): Promise<HeroBanner> {
  return apiClient<HeroBanner>(`/hero-banners/${id}`);
}

export async function createHeroBanner(data: CreateHeroBannerPayload): Promise<HeroBanner> {
  return apiClient<HeroBanner>('/hero-banners', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateHeroBanner(
  id: string,
  data: UpdateHeroBannerPayload
): Promise<HeroBanner> {
  return apiClient<HeroBanner>(`/hero-banners/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function deleteHeroBanner(id: string): Promise<void> {
  await apiClient(`/hero-banners/${id}`, { method: 'DELETE' });
}
