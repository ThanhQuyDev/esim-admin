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
  PartnerMarketing,
  PartnerRevenueByType,
  PartnerActivityByType,
  PartnerSeriesByType,
  PartnerTopDestination,
  TopPartnerRow,
  PartnerListStats,
  AdminCreatePartnerPayload,
  BulkPartnerStatusPayload,
  PartnerStatusChange,
  PartnerPerformance,
  UpdatePartnerProfileByAdminPayload,
  CommissionSummary,
  CommissionFilters,
  ReconciliationList,
  SetReconciliationStatusPayload
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

/** Tick/untick "được đặt tên link tiếp thị" for this partner (#014). */
export async function setPartnerLinkCodePermission(
  id: number,
  canCustomLinkCode: boolean
): Promise<Partner> {
  return apiClient<Partner>(`/partners/${id}/link-code-permission`, {
    method: 'PATCH',
    body: JSON.stringify({ canCustomLinkCode })
  });
}

/** Create a partner account by hand (#059). */
export async function adminCreatePartner(
  data: AdminCreatePartnerPayload
): Promise<{ partnerId: number; userId: number }> {
  return apiClient<{ partnerId: number; userId: number }>('/partners', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/** Change several partners' status at once (#059). */
export async function bulkUpdatePartnerStatus(
  data: BulkPartnerStatusPayload
): Promise<{ updated: number; skipped: number[] }> {
  return apiClient<{ updated: number; skipped: number[] }>('/partners/bulk-status', {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

/** A partner's status history, with the reason each time (#060). */
export async function getPartnerStatusHistory(id: number): Promise<PartnerStatusChange[]> {
  return apiClient<PartnerStatusChange[]>(`/partners/${id}/status-history`);
}

/** Contract details and this partner's own deposit limits (#061). */
export async function updatePartnerByAdmin(
  id: number,
  data: UpdatePartnerProfileByAdminPayload
): Promise<Partner> {
  return apiClient<Partner>(`/partners/${id}/profile`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

/** Link and code performance over the last 30 days (#061). */
export async function getPartnerPerformance(id: number): Promise<PartnerPerformance> {
  return apiClient<PartnerPerformance>(`/partners/${id}/performance`);
}

/** Create a marketing link on a partner's behalf (#061). */
export async function adminCreateLinkForPartner(
  id: number,
  data: { code?: string; label?: string; targetPath?: string }
): Promise<unknown> {
  return apiClient<unknown>(`/partners/${id}/links`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/** Record an admin's own note on this partner (#056). */
export async function setPartnerAdminNote(id: number, adminNote: string): Promise<Partner> {
  return apiClient<Partner>(`/partners/${id}/admin-note`, {
    method: 'PATCH',
    body: JSON.stringify({ adminNote })
  });
}

/** Tick/untick "được phân quyền affiliate" for this partner (#048). */
export async function setPartnerAffiliateGrant(
  id: number,
  canAffiliate: boolean
): Promise<Partner> {
  return apiClient<Partner>(`/partners/${id}/affiliate-grant`, {
    method: 'PATCH',
    body: JSON.stringify({ canAffiliate })
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

export async function getCommissions(
  filters: CommissionFilters
): Promise<{ data: OrderPartnerCommission[]; totalCount: number }> {
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

/** Revenue and orders over time, split by partner type (#052). */
export async function getPartnerSeriesByType(params?: {
  from?: string;
  to?: string;
  groupBy?: string;
}): Promise<PartnerSeriesByType> {
  const search = new URLSearchParams();
  if (params?.from) search.set('from', params.from);
  if (params?.to) search.set('to', params.to);
  if (params?.groupBy) search.set('groupBy', params.groupBy);
  const query = search.toString();
  return apiClient<PartnerSeriesByType>(`/partners/series-by-type${query ? `?${query}` : ''}`);
}

/** The reconciliation list: one row per partner for one period (#065). */
export async function getReconciliations(params: {
  period?: string;
  search?: string;
  status?: string;
}): Promise<ReconciliationList> {
  return apiClient<ReconciliationList>(`/partners/reconciliations${toQuery(params)}`);
}

/** Sign off (or hold) one or more statements (#065). */
export async function setReconciliationStatus(
  data: SetReconciliationStatusPayload
): Promise<{ updated: number }> {
  return apiClient<{ updated: number }>('/partners/reconciliations/status', {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

/** The five figures at the head of "Hoa hồng & Đối soát" (#063). */
export async function getCommissionSummary(): Promise<CommissionSummary> {
  return apiClient<CommissionSummary>('/partners/commission-summary');
}

/** The four figures at the head of the partner list (#057). */
export async function getPartnerListStats(): Promise<PartnerListStats> {
  return apiClient<PartnerListStats>('/partners/list-stats');
}

/** The partners bringing in the most (#054). */
export async function getTopPartners(params?: {
  from?: string;
  to?: string;
  limit?: number;
}): Promise<TopPartnerRow[]> {
  const search = new URLSearchParams();
  if (params?.from) search.set('from', params.from);
  if (params?.to) search.set('to', params.to);
  if (params?.limit) search.set('limit', String(params.limit));
  const query = search.toString();
  return apiClient<TopPartnerRow[]>(`/partners/top-partners${query ? `?${query}` : ''}`);
}

/** Where partner-driven orders are going (#052). */
export async function getPartnerTopDestinations(range?: {
  from?: string;
  to?: string;
}): Promise<PartnerTopDestination[]> {
  const search = new URLSearchParams();
  if (range?.from) search.set('from', range.from);
  if (range?.to) search.set('to', range.to);
  const query = search.toString();
  return apiClient<PartnerTopDestination[]>(
    `/partners/top-destinations${query ? `?${query}` : ''}`
  );
}

/** Orders, live partners and what is waiting to be settled (#051). */
export async function getPartnerActivityByType(range?: {
  from?: string;
  to?: string;
}): Promise<PartnerActivityByType> {
  const search = new URLSearchParams();
  if (range?.from) search.set('from', range.from);
  if (range?.to) search.set('to', range.to);
  const query = search.toString();
  return apiClient<PartnerActivityByType>(`/partners/activity-by-type${query ? `?${query}` : ''}`);
}

/** What esim.vn keeps from each kind of partner, over a period (#050). */
export async function getPartnerRevenueByType(range?: {
  from?: string;
  to?: string;
}): Promise<PartnerRevenueByType> {
  const search = new URLSearchParams();
  if (range?.from) search.set('from', range.from);
  if (range?.to) search.set('to', range.to);
  const query = search.toString();
  return apiClient<PartnerRevenueByType>(`/partners/revenue-by-type${query ? `?${query}` : ''}`);
}

/**
 * One partner's marketing links and discount codes (#095) — "bấm xem chi tiết
 * đối tác để xem các mã/liên kết đối tác đã tạo".
 */
export async function getPartnerMarketing(id: number): Promise<PartnerMarketing> {
  return apiClient<PartnerMarketing>(`/partners/${id}/marketing`);
}
