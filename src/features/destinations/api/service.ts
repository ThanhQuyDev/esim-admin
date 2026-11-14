import { apiClient } from '@/lib/api-client';
import type {
  Destination,
  DestinationFilters,
  DestinationsResponse,
  CreateDestinationPayload,
  UpdateDestinationPayload
} from './types';
import { uploadFileToCloudinary } from '@/lib/cloudinary-upload';

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
  // Signed by the API (security 15/11/2026) — no public upload preset.
  return uploadFileToCloudinary(file, 'cms', 'image');
}
