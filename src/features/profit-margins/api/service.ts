import { apiClient } from '@/lib/api-client';
import type {
  ProfitMarginTier,
  ProfitMarginTierFilters,
  ProfitMarginTierResponse,
  CreateProfitMarginTierPayload,
  UpdateProfitMarginTierPayload
} from './types';

const BASE = '/profit-margins/tiers';

export async function getProfitMarginTiers(
  filters: ProfitMarginTierFilters
): Promise<ProfitMarginTierResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.filters) params.set('filters', filters.filters);
  if (filters.sort) params.set('sort', filters.sort);
  const query = params.toString();
  return apiClient<ProfitMarginTierResponse>(`${BASE}${query ? `?${query}` : ''}`);
}

export async function getProfitMarginTierById(id: number): Promise<ProfitMarginTier> {
  return apiClient<ProfitMarginTier>(`${BASE}/${id}`);
}

export async function createProfitMarginTier(
  data: CreateProfitMarginTierPayload
): Promise<ProfitMarginTier> {
  return apiClient<ProfitMarginTier>(BASE, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateProfitMarginTier(
  id: number,
  data: UpdateProfitMarginTierPayload
): Promise<ProfitMarginTier> {
  return apiClient<ProfitMarginTier>(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deleteProfitMarginTier(id: number): Promise<void> {
  await apiClient(`${BASE}/${id}`, { method: 'DELETE' });
}
