import { apiClient } from '@/lib/api-client';
import type {
  WhyChooseUs,
  WhyChooseUsFilters,
  WhyChooseUsResponse,
  CreateWhyChooseUsPayload,
  UpdateWhyChooseUsPayload
} from './types';

export async function getWhyChooseUs(filters: WhyChooseUsFilters): Promise<WhyChooseUsResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.filters) params.set('filters', filters.filters);
  if (filters.sort) params.set('sort', filters.sort);
  const query = params.toString();
  return apiClient<WhyChooseUsResponse>(`/why-choose-us${query ? `?${query}` : ''}`);
}

export async function getWhyChooseUsById(id: number): Promise<WhyChooseUs> {
  return apiClient<WhyChooseUs>(`/why-choose-us/${id}`);
}

export async function createWhyChooseUs(data: CreateWhyChooseUsPayload): Promise<WhyChooseUs> {
  return apiClient<WhyChooseUs>('/why-choose-us', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateWhyChooseUs(
  id: number,
  data: UpdateWhyChooseUsPayload
): Promise<WhyChooseUs> {
  return apiClient<WhyChooseUs>(`/why-choose-us/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function deleteWhyChooseUs(id: number): Promise<void> {
  await apiClient(`/why-choose-us/${id}`, { method: 'DELETE' });
}
