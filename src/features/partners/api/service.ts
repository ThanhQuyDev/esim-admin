import { apiClient } from '@/lib/api-client';
import type {
  Partner,
  PartnerListResponse,
  PartnerOverview,
  PartnerFilters,
  PartnerWalletTransaction,
  PartnerDepositRequest,
  OrderPartnerCommission,
  PartnerPayout,
  PartnerTier,
  RejectPartnerPayload,
  UpdatePartnerStatusPayload,
  AssignTierPayload,
  AdjustWalletPayload,
  ProcessPayoutPayload,
  CreateTierPayload,
  UpdateTierPayload,
  PartnerMarketing
} from './types';

function toQuery(params: Record<string, unknown>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') usp.set(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : '';
}

export async function getPartners(filters: PartnerFilters): Promise<PartnerListResponse> {
  return apiClient<PartnerListResponse>(`/partners${toQuery(filters)}`);
}

export async function getPartner(id: number): Promise<Partner> {
  return apiClient<Partner>(`/partners/${id}`);
}

export async function approvePartner(id: number): Promise<Partner> {
  return apiClient<Partner>(`/partners/${id}/approve`, { method: 'POST' });
}

export async function rejectPartner(id: number, data: RejectPartnerPayload): Promise<Partner> {
  return apiClient<Partner>(`/partners/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updatePartnerStatus(
  id: number,
  data: UpdatePartnerStatusPayload
): Promise<Partner> {
  return apiClient<Partner>(`/partners/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function assignPartnerTier(id: number, data: AssignTierPayload): Promise<Partner> {
  return apiClient<Partner>(`/partners/${id}/tier`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function adjustPartnerWallet(
  id: number,
  data: AdjustWalletPayload
): Promise<PartnerWalletTransaction> {
  return apiClient<PartnerWalletTransaction>(`/partners/${id}/wallet/adjust`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function getDepositRequests(status?: string): Promise<PartnerDepositRequest[]> {
  return apiClient<PartnerDepositRequest[]>(`/partners/deposit-requests${toQuery({ status })}`);
}

export async function confirmDepositRequest(id: number): Promise<PartnerDepositRequest> {
  return apiClient<PartnerDepositRequest>(`/partners/deposit-requests/${id}/confirm`, {
    method: 'POST'
  });
}

export async function getCommissions(filters: {
  page?: number;
  limit?: number;
  partnerId?: number;
  status?: string;
}): Promise<{ data: OrderPartnerCommission[]; totalCount: number }> {
  return apiClient(`/partners/commissions${toQuery(filters)}`);
}

export async function getPayouts(status?: string): Promise<PartnerPayout[]> {
  return apiClient<PartnerPayout[]>(`/partners/payouts${toQuery({ status })}`);
}

export async function approvePayout(id: number): Promise<PartnerPayout> {
  return apiClient<PartnerPayout>(`/partners/payouts/${id}/approve`, { method: 'POST' });
}

export async function rejectPayout(id: number, data: ProcessPayoutPayload): Promise<PartnerPayout> {
  return apiClient<PartnerPayout>(`/partners/payouts/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function markPayoutPaid(
  id: number,
  data: ProcessPayoutPayload
): Promise<PartnerPayout> {
  return apiClient<PartnerPayout>(`/partners/payouts/${id}/mark-paid`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function getTiers(): Promise<PartnerTier[]> {
  return apiClient<PartnerTier[]>('/partners/tiers');
}

export async function createTier(data: CreateTierPayload): Promise<PartnerTier> {
  return apiClient<PartnerTier>('/partners/tiers', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateTier(id: number, data: UpdateTierPayload): Promise<PartnerTier> {
  return apiClient<PartnerTier>(`/partners/tiers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function getPartnerOverview(): Promise<PartnerOverview> {
  return apiClient<PartnerOverview>('/partners/overview');
}

/**
 * One partner's marketing links and discount codes (#095) — "bấm xem chi tiết
 * đối tác để xem các mã/liên kết đối tác đã tạo".
 */
export async function getPartnerMarketing(id: number): Promise<PartnerMarketing> {
  return apiClient<PartnerMarketing>(`/partners/${id}/marketing`);
}
