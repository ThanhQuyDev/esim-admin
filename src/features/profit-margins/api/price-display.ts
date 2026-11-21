import { apiClient } from '@/lib/api-client';

/** Struck-out price on plans without a discount (vande-2011 #012). */
export type PriceDisplaySetting = { autoStrikePercent: number };

export function getPriceDisplay(): Promise<PriceDisplaySetting> {
  return apiClient<PriceDisplaySetting>('/profit-margins/price-display');
}

export function setPriceDisplay(autoStrikePercent: number): Promise<PriceDisplaySetting> {
  return apiClient<PriceDisplaySetting>('/profit-margins/price-display', {
    method: 'PUT',
    body: JSON.stringify({ autoStrikePercent })
  });
}
