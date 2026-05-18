import { apiClient } from '@/lib/api-client';
import type {
  Faq,
  FaqFilters,
  FaqsResponse,
  FaqByContextFilters,
  CreateFaqPayload,
  UpdateFaqPayload
} from './types';

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

export async function getFaqsByContext(filters: FaqByContextFilters): Promise<Faq[]> {
  const params = new URLSearchParams();
  if (filters.url) params.set('url', filters.url);
  if (filters.blogId) params.set('blogId', filters.blogId);
  if (filters.language) params.set('language', filters.language);
  if (filters.limit) params.set('limit', String(filters.limit));
  const query = params.toString();
  return apiClient<Faq[]>(`/faqs/by-context${query ? `?${query}` : ''}`);
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
