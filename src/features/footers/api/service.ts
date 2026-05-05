import { apiClient } from '@/lib/api-client';
import type {
  Footer,
  FooterFilters,
  FooterResponse,
  CreateFooterPayload,
  UpdateFooterPayload
} from './types';

export async function getFooters(filters: FooterFilters): Promise<FooterResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.filters) params.set('filters', filters.filters);
  if (filters.sort) params.set('sort', filters.sort);
  const query = params.toString();
  return apiClient<FooterResponse>(`/footers${query ? `?${query}` : ''}`);
}

export async function getFooterById(id: string): Promise<Footer> {
  return apiClient<Footer>(`/footers/${id}`);
}

export async function createFooter(data: CreateFooterPayload): Promise<Footer> {
  return apiClient<Footer>('/footers', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateFooter(id: string, data: UpdateFooterPayload): Promise<Footer> {
  return apiClient<Footer>(`/footers/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteFooter(id: string): Promise<void> {
  await apiClient(`/footers/${id}`, { method: 'DELETE' });
}
