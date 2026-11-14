import { apiClient } from '@/lib/api-client';
import type {
  CreateProviderPayload,
  ProviderSalesStatus,
  ProviderSalesStatusesResponse,
  SetProviderSalesStatusPayload,
  UpdateProviderPayload
} from './types';

const BASE = '/providers';

export async function getProviderSalesStatuses(): Promise<ProviderSalesStatusesResponse> {
  return apiClient<ProviderSalesStatusesResponse>(BASE);
}

export async function setProviderSalesStatus(
  provider: string,
  data: SetProviderSalesStatusPayload
): Promise<{ data: ProviderSalesStatus }> {
  return apiClient<{ data: ProviderSalesStatus }>(
    `${BASE}/${encodeURIComponent(provider)}/sales-status`,
    { method: 'PUT', body: JSON.stringify(data) }
  );
}

/** "+ Thêm nhà cung cấp" (vande-1411 #024). */
export async function createProvider(
  data: CreateProviderPayload
): Promise<{ data: ProviderSalesStatus }> {
  return apiClient<{ data: ProviderSalesStatus }>(BASE, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/** "Cập nhật": the name and the overview code. */
export async function updateProvider(
  provider: string,
  data: UpdateProviderPayload
): Promise<{ data: ProviderSalesStatus }> {
  return apiClient<{ data: ProviderSalesStatus }>(`${BASE}/${encodeURIComponent(provider)}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

/** "Xoá": refused for a supplier with an API, plans or eSIMs. */
export async function deleteProvider(provider: string): Promise<void> {
  await apiClient(`${BASE}/${encodeURIComponent(provider)}`, {
    method: 'DELETE'
  });
}

/** Where the full catalogue sync stands (doitac-1410 #074). */
export type FullSyncStatus = {
  running: boolean;
  trigger: 'cron' | 'manual' | null;
  startedAt: string | null;
  finishedAt: string | null;
  errors: string[];
};

export async function getFullSyncStatus(): Promise<FullSyncStatus> {
  return apiClient<FullSyncStatus>(`${BASE}/full-sync`);
}

/** One past run of the full sync (vande #078). */
export type FullSyncRun = {
  id: number;
  startedAt: string;
  finishedAt: string | null;
  durationSeconds: number | null;
  startedBy: string;
  errors: string[];
};

/** The latest runs, newest first (vande #078). */
export async function getFullSyncHistory(): Promise<FullSyncRun[]> {
  return apiClient<FullSyncRun[]>(`${BASE}/full-sync/history`);
}

/** "Cập nhật lại toàn bộ sản phẩm": the 6-hourly sync, now. */
export async function startFullSync(): Promise<{
  started: boolean;
  status: FullSyncStatus;
}> {
  return apiClient(`${BASE}/full-sync`, { method: 'POST' });
}
