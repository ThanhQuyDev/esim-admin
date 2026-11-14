import { apiClient } from '@/lib/api-client';
import type {
  Region,
  RegionFilters,
  RegionsResponse,
  CreateRegionPayload,
  UpdateRegionPayload
} from './types';
import { uploadFileToCloudinary } from '@/lib/cloudinary-upload';

export async function getRegions(filters: RegionFilters): Promise<RegionsResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.filters) params.set('filters', filters.filters);
  if (filters.sort) params.set('sort', filters.sort);

  const query = params.toString();
  return apiClient<RegionsResponse>(`/regions${query ? `?${query}` : ''}`);
}

export async function getRegion(id: number): Promise<Region> {
  return apiClient<Region>(`/regions/${id}`);
}

export async function createRegion(data: CreateRegionPayload): Promise<Region> {
  return apiClient<Region>('/regions', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateRegion(id: number, data: UpdateRegionPayload): Promise<Region> {
  return apiClient<Region>(`/regions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function deleteRegion(id: number): Promise<void> {
  await apiClient(`/regions/${id}`, {
    method: 'DELETE'
  });
}

export async function uploadToCloudinary(file: File): Promise<string> {
  // Signed by the API (security 15/11/2026) — no public upload preset.
  return uploadFileToCloudinary(file, 'cms', 'image');
}
