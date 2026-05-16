import { apiClient } from '@/lib/api-client';
import type {
  Esim,
  EsimDetail,
  EsimFilters,
  EsimsResponse,
  CreateEsimPayload,
  UpdateEsimPayload,
  ImportEsimsExcelPayload,
  ImportEsimsExcelResponse
} from './types';

const BASE = '/esims';

export async function getEsims(filters: EsimFilters): Promise<EsimsResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.filters) params.set('filters', filters.filters);
  if (filters.sort) params.set('sort', filters.sort);

  const query = params.toString();
  return apiClient<EsimsResponse>(`${BASE}${query ? `?${query}` : ''}`);
}

export async function getEsim(id: number): Promise<EsimDetail> {
  return apiClient<EsimDetail>(`${BASE}/${id}`);
}

export async function createEsim(data: CreateEsimPayload): Promise<Esim> {
  return apiClient<Esim>(BASE, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateEsim(id: number, data: UpdateEsimPayload): Promise<Esim> {
  return apiClient<Esim>(`${BASE}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function deleteEsim(id: number): Promise<void> {
  await apiClient(`${BASE}/${id}`, { method: 'DELETE' });
}

export async function importEsimsExcel(
  payload: ImportEsimsExcelPayload
): Promise<ImportEsimsExcelResponse> {
  const formData = new FormData();
  formData.append('file', payload.file);
  formData.append('provider', payload.provider);
  formData.append('countryCode', payload.countryCode);

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
