import { apiClient } from '@/lib/api-client';
import type {
  CreateProviderDepositEntryPayload,
  ProviderDepositEntriesResponse,
  ProviderDepositEntry,
  ProviderDepositEntryFilters,
  ProviderDepositSummaryResponse,
  UpdateProviderDepositEntryPayload
} from './types';

const BASE = '/provider-deposits';

export async function getProviderDepositSummary(): Promise<ProviderDepositSummaryResponse> {
  return apiClient<ProviderDepositSummaryResponse>(`${BASE}/summary`);
}

export async function getProviderDepositEntries(
  filters: ProviderDepositEntryFilters
): Promise<ProviderDepositEntriesResponse> {
  const params = new URLSearchParams();
  if (filters.provider) params.set('provider', filters.provider);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  const query = params.toString();
  return apiClient<ProviderDepositEntriesResponse>(`${BASE}/entries${query ? `?${query}` : ''}`);
}

export async function createProviderDepositEntry(
  data: CreateProviderDepositEntryPayload
): Promise<ProviderDepositEntry> {
  return apiClient<ProviderDepositEntry>(`${BASE}/entries`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateProviderDepositEntry(
  id: number,
  data: UpdateProviderDepositEntryPayload
): Promise<ProviderDepositEntry> {
  return apiClient<ProviderDepositEntry>(`${BASE}/entries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function deleteProviderDepositEntry(id: number): Promise<void> {
  await apiClient(`${BASE}/entries/${id}`, { method: 'DELETE' });
}
