import { apiClient } from '@/lib/api-client';
import type { Faq, FaqFilters, FaqsResponse, CreateFaqPayload, UpdateFaqPayload } from './types';

export async function getFaqs(filters: FaqFilters): Promise<FaqsResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.filters) params.set('filters', filters.filters);
  if (filters.sort) params.set('sort', filters.sort);
  const query = params.toString();
  return apiClient<FaqsResponse>(`/faqs${query ? `?${query}` : ''}`);
}

export async function getFaq(id: number): Promise<Faq> {
  return apiClient<Faq>(`/faqs/${id}`);
}

export async function createFaq(data: CreateFaqPayload): Promise<Faq> {
  return apiClient<Faq>('/faqs', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateFaq(id: number, data: UpdateFaqPayload): Promise<Faq> {
  return apiClient<Faq>(`/faqs/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteFaq(id: number): Promise<void> {
  await apiClient(`/faqs/${id}`, { method: 'DELETE' });
}
