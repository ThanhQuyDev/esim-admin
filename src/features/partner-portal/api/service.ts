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
  PartnerApplyPayload,
  MySummary,
  MyOrder,
  PartnerTier,
  MyTicket,
  CreateTicketPayload,
  MyCoupon,
  MyTierEvaluation
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

export async function getMySummary(): Promise<MySummary> {
  return apiClient<MySummary>('/partner-portal/summary');
}

export async function getMyOrders(): Promise<MyOrder[]> {
  return apiClient<MyOrder[]>('/partner-portal/orders');
}

export async function getMyTiers(): Promise<PartnerTier[]> {
  return apiClient<PartnerTier[]>('/partner-portal/tiers');
}

export async function getMyTickets(): Promise<MyTicket[]> {
  const res = await apiClient<{ data: MyTicket[] }>('/tickets/mine?limit=50');
  return res?.data ?? [];
}

export async function createMyTicket(data: CreateTicketPayload): Promise<MyTicket> {
  return apiClient<MyTicket>('/tickets/mine', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function getMyCoupons(): Promise<MyCoupon[]> {
  return apiClient<MyCoupon[]>('/partner-portal/coupons');
}

export async function getMyTierEvaluations(): Promise<MyTierEvaluation[]> {
  return apiClient<MyTierEvaluation[]>('/partner-portal/tier-evaluations');
}
