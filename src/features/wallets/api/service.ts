import { apiClient } from '@/lib/api-client';
import type {
  WalletFilters,
  WalletsResponse,
  WalletMeResponse,
  WalletTransactionResponse,
  ManualWalletAdjustRequest,
  CancelWalletRequest,
  UpdateWalletStatusRequest
} from './types';

export async function getWallets(filters: WalletFilters): Promise<WalletsResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.filters) params.set('filters', filters.filters);
  if (filters.sort) params.set('sort', filters.sort);

  const query = params.toString();
  return apiClient<WalletsResponse>(`/wallets/admin${query ? `?${query}` : ''}`);
}

export async function getWallet(userId: number): Promise<WalletMeResponse> {
  return apiClient<WalletMeResponse>(`/wallets/admin/${userId}`);
}

export async function adjustWalletBalance(
  userId: number,
  data: ManualWalletAdjustRequest
): Promise<WalletTransactionResponse> {
  return apiClient<WalletTransactionResponse>(`/wallets/admin/${userId}/adjust`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function cancelWalletBalance(
  userId: number,
  data: CancelWalletRequest
): Promise<WalletTransactionResponse | null> {
  return apiClient<WalletTransactionResponse | null>(`/wallets/admin/${userId}/cancel`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateWalletStatus(
  userId: number,
  data: UpdateWalletStatusRequest
): Promise<WalletMeResponse> {
  return apiClient<WalletMeResponse>(`/wallets/admin/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}
