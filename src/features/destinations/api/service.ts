import { apiClient } from '@/lib/api-client';
import type {
  Destination,
  DestinationFilters,
  DestinationsResponse,
  CreateDestinationPayload,
  UpdateDestinationPayload
} from './types';

export async function getDestinations(filters: DestinationFilters): Promise<DestinationsResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.filters) params.set('filters', filters.filters);
  if (filters.sort) params.set('sort', filters.sort);

  const query = params.toString();
  return apiClient<DestinationsResponse>(`/destinations${query ? `?${query}` : ''}`);
}

export async function getDestination(id: number): Promise<Destination> {
  return apiClient<Destination>(`/destinations/${id}`);
}

export async function createDestination(data: CreateDestinationPayload): Promise<Destination> {
  return apiClient<Destination>('/destinations', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateDestination(
  id: number,
  data: UpdateDestinationPayload
): Promise<Destination> {
  return apiClient<Destination>(`/destinations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function deleteDestination(id: number): Promise<void> {
  await apiClient(`/destinations/${id}`, {
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
