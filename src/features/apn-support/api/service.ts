import { apiClient } from '@/lib/api-client';
import type { ApnSupport, ApnSupportFilters, ApnSupportResponse, ImportApnResponse } from './types';

export type { ApnSupport };

export async function getApnSupport(filters: ApnSupportFilters): Promise<ApnSupportResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.filters) params.set('filters', filters.filters);
  if (filters.sort) params.set('sort', filters.sort);
  const query = params.toString();
  return apiClient<ApnSupportResponse>(`/apn-support${query ? `?${query}` : ''}`);
}

/** Uploading replaces the whole table, so the caller confirms first. */
export async function importApnExcel(file: File): Promise<ImportApnResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/apn-support/import', {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Nhập file thất bại: ${res.status}`);
  }

  return res.json();
}
