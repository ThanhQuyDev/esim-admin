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
  MyTierEvaluation,
  MyTopDestination,
  BankAccountChangePayload,
  BankAccountChangeRequested
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

/** Step one of a bank account change: mail the partner a code (#005). */
export async function requestBankAccountChange(
  data: BankAccountChangePayload
): Promise<BankAccountChangeRequested> {
  return apiClient<BankAccountChangeRequested>('/partner-portal/bank-account/otp', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/** Step two: the code applies the account that was requested (#005). */
export async function confirmBankAccountChange(otp: string): Promise<MyPartner> {
  return apiClient<MyPartner>('/partner-portal/bank-account/confirm', {
    method: 'POST',
    body: JSON.stringify({ otp })
  });
}

export async function getMyTopDestinations(range?: {
  from?: string;
  to?: string;
}): Promise<MyTopDestination[]> {
  const search = new URLSearchParams();
  if (range?.from) search.set('from', range.from);
  if (range?.to) search.set('to', range.to);
  const query = search.toString();
  return apiClient<MyTopDestination[]>(
    `/partner-portal/top-destinations${query ? `?${query}` : ''}`
  );
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

/** Retire a marketing link (#016). */
export async function deleteMyLink(id: number): Promise<void> {
  await apiClient(`/partner-portal/links/${id}`, { method: 'DELETE' });
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

export async function getMySummary(range?: { from?: string; to?: string }): Promise<MySummary> {
  const search = new URLSearchParams();
  if (range?.from) search.set('from', range.from);
  if (range?.to) search.set('to', range.to);
  const query = search.toString();
  return apiClient<MySummary>(`/partner-portal/summary${query ? `?${query}` : ''}`);
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
