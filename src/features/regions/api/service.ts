import { apiClient } from '@/lib/api-client';
import type {
  Region,
  RegionFilters,
  RegionsResponse,
  CreateRegionPayload,
  UpdateRegionPayload
} from './types';

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
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration is missing');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    throw new Error('Failed to upload image to Cloudinary');
  }

  const data = await res.json();
  return data.secure_url as string;
}
