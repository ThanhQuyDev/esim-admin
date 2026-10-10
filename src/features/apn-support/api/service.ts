import { apiClient } from '@/lib/api-client';
import type {
  ApnSupport,
  ApnSupportFilters,
  ApnSupportResponse,
  ImportApnResponse,
  SaveApnSupportPayload
} from './types';

export type { ApnSupport };

export async function getApnSupport(filters: ApnSupportFilters): Promise<ApnSupportResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.apns) params.set('apns', filters.apns);
  if (filters.supports) params.set('supports', filters.supports);
  if (filters.needsReview !== undefined) params.set('needsReview', String(filters.needsReview));
  const query = params.toString();
  return apiClient<ApnSupportResponse>(`/apn-support${query ? `?${query}` : ''}`);
}

/** Every APN in the table, for the filter's select box (#044). */
export async function getApnOptions(): Promise<{ apn: string; apnLabel: string }[]> {
  const res = await apiClient<{ data: { apn: string; apnLabel: string }[] }>(
    '/apn-support/options'
  );
  return res?.data ?? [];
}

export async function createApnSupport(data: SaveApnSupportPayload): Promise<ApnSupport> {
  return apiClient<ApnSupport>('/apn-support', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateApnSupport(
  id: string,
  data: Partial<SaveApnSupportPayload>
): Promise<ApnSupport> {
  return apiClient<ApnSupport>(`/apn-support/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function deleteApnSupport(id: string): Promise<void> {
  await apiClient(`/apn-support/${id}`, { method: 'DELETE' });
}

/** Pull every APN the suppliers' plans use into the table (#044). */
export async function syncApnFromPlans(): Promise<{ added: number; total: number }> {
  return apiClient<{ added: number; total: number }>('/apn-support/sync-from-plans', {
    method: 'POST'
  });
}

/** Download the table as .xlsx, in the layout the import reads (#044). */
export async function downloadApnExcel(): Promise<void> {
  const res = await fetch('/api/apn-support/export');
  if (!res.ok) throw new Error(`Xuất file thất bại: ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `apn-tiktok-gpt-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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
