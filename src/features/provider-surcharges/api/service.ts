import { apiClient } from '@/lib/api-client';
import type {
  ProviderSurcharge,
  ProviderSurchargesResponse,
  SaveProviderSurchargePayload
} from './types';

const BASE = '/provider-surcharges';

export async function getProviderSurcharges(): Promise<ProviderSurchargesResponse> {
  return apiClient<ProviderSurchargesResponse>(BASE);
}

export async function saveProviderSurcharge(
  provider: string,
  data: SaveProviderSurchargePayload
): Promise<{ data: ProviderSurcharge }> {
  return apiClient<{ data: ProviderSurcharge }>(`${BASE}/${encodeURIComponent(provider)}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}
