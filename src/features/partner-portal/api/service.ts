import { apiClient } from '@/lib/api-client';
import type {
  MyPartner,
  UpdateMyProfilePayload,
  MyWalletSummary,
  MyWalletTransaction,
  MyDepositRequest,
  CreateDepositRequestPayload,
  MyLink,
  CreateLinkPayload,
  UpdateLinkPayload,
  MyCommission,
  MyPayout,
  CreatePayoutPayload,
  PartnerApplyPayload
} from './types';

export async function applyAsPartner(
  data: PartnerApplyPayload
): Promise<{ partnerId: number; userId: number }> {
  return apiClient('/partner-portal/apply', { method: 'POST', body: JSON.stringify(data) });
}

export async function getMyPartner(): Promise<MyPartner> {
  return apiClient<MyPartner>('/partner-portal/me');
}

export async function updateMyPartnerProfile(data: UpdateMyProfilePayload): Promise<MyPartner> {
  return apiClient<MyPartner>('/partner-portal/me', {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function getMyWallet(): Promise<MyWalletSummary> {
  return apiClient<MyWalletSummary>('/partner-portal/wallet');
}

export async function getMyWalletTransactions(): Promise<MyWalletTransaction[]> {
  return apiClient<MyWalletTransaction[]>('/partner-portal/wallet/transactions');
}

export async function getMyDepositRequests(): Promise<MyDepositRequest[]> {
  return apiClient<MyDepositRequest[]>('/partner-portal/wallet/deposit-requests');
}

export async function createMyDepositRequest(
  data: CreateDepositRequestPayload
): Promise<MyDepositRequest> {
  return apiClient<MyDepositRequest>('/partner-portal/wallet/deposit-requests', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function getMyLinks(): Promise<MyLink[]> {
  return apiClient<MyLink[]>('/partner-portal/links');
}

export async function createMyLink(data: CreateLinkPayload): Promise<MyLink> {
  return apiClient<MyLink>('/partner-portal/links', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateMyLink(id: number, data: UpdateLinkPayload): Promise<MyLink> {
  return apiClient<MyLink>(`/partner-portal/links/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function getMyCommissions(): Promise<{ data: MyCommission[]; totalCount: number }> {
  return apiClient('/partner-portal/commissions');
}

export async function getMyPayouts(): Promise<MyPayout[]> {
  return apiClient<MyPayout[]>('/partner-portal/payouts');
}

export async function createMyPayout(data: CreatePayoutPayload): Promise<MyPayout> {
  return apiClient<MyPayout>('/partner-portal/payouts', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}
