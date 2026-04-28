import { apiClient } from '@/lib/api-client';
import type {
  EsimDetail,
  EsimFilters,
  EsimsResponse,
  ImportEsimsExcelPayload,
  ImportEsimsExcelResponse
} from './types';

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

export async function importEsimsExcel(
  payload: ImportEsimsExcelPayload
): Promise<ImportEsimsExcelResponse> {
  const formData = new FormData();
  formData.append('file', payload.file);
  formData.append('provider', payload.provider);
  formData.append('countryCode', payload.countryCode);
  formData.append('type', payload.type);

  const res = await fetch('/api/esims/import-excel', {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Import failed: ${res.status}`);
  }

  return res.json();
}
