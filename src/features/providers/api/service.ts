import { apiClient } from '@/lib/api-client';
import type {
  ProviderSalesStatus,
  ProviderSalesStatusesResponse,
  SetProviderSalesStatusPayload
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
