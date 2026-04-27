import { apiClient } from '@/lib/api-client';
import type { EsimDetail, EsimFilters, EsimsResponse } from './types';

export async function getEsims(filters: EsimFilters): Promise<EsimsResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.filters) params.set('filters', filters.filters);
  if (filters.sort) params.set('sort', filters.sort);

  const query = params.toString();
  return apiClient<EsimsResponse>(`/esims${query ? `?${query}` : ''}`);
}

export async function getEsim(id: number): Promise<EsimDetail> {
  return apiClient<EsimDetail>(`/esims/${id}`);
}
