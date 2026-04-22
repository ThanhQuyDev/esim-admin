import { apiClient } from '@/lib/api-client';
import type { ProfitMargin, SaveProfitMarginPayload } from './types';

export async function getProfitMargin(): Promise<ProfitMargin | null> {
  return apiClient<ProfitMargin | null>('/profit-margins');
}

export async function updateProfitMargin(data: SaveProfitMarginPayload): Promise<ProfitMargin> {
  return apiClient<ProfitMargin>('/profit-margins', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}
