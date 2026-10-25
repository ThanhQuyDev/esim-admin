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
  DepositPromotion,
  DepositPromotionPayload,
  PartnerAdminStats,
  PartnerWalletSummary,
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
  SetReconciliationStatusPayload,
  PayoutSummary,
  BulkPayoutDecisionPayload,
  AdminPayoutList,
  PayoutFilters,
  PartnerOption,
  PartnerOrderFilters,
  PartnerProgramSettings,
  UpdateProgramSettingsPayload,
  PartnerNotification,
  CreateNotificationPayload,
  UpdateNotificationPayload,
  AdminLinkStats,
  AdminLinkFilters,
  AdminLinkList,
  AdminLinkDetail,
  PartnerCreditStatement
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

/** "Không cần ký quỹ" + "Hạn mức giao dịch" (vande #056). */
export async function setPartnerCreditLimit(
  id: number,
  data: { noDepositRequired: boolean; creditLimitVnd?: number }
): Promise<Partner> {
  return apiClient<Partner>(`/partners/${id}/credit-limit`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

/** A no-deposit partner's statement for `period` (YYYY-MM) (vande #056). */
export async function getPartnerCreditStatement(
  id: number,
  period: string
): Promise<PartnerCreditStatement> {
  return apiClient<PartnerCreditStatement>(
    `/partners/${id}/credit-statement?period=${encodeURIComponent(period)}`
  );
}

/** Email the statement to the partner now (vande #056). */
export async function sendPartnerCreditStatement(
  id: number,
  period: string
): Promise<{ sent: number; partners: number }> {
  return apiClient(`/partners/${id}/credit-statement/send?period=${encodeURIComponent(period)}`, {
    method: 'POST'
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

export async function getDepositRequests(
  status?: string,
  search?: string
): Promise<PartnerDepositRequest[]> {
  return apiClient<PartnerDepositRequest[]>(
    `/partners/deposit-requests${toQuery({ status, search })}`
  );
}

/** "Từ chối", with the reason the partner reads (doitac-1410 #063). */
export async function rejectDepositRequest(
  id: number,
  reason: string
): Promise<PartnerDepositRequest> {
  return apiClient<PartnerDepositRequest>(`/partners/deposit-requests/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
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

export async function getPayouts(filters: PayoutFilters = {}): Promise<AdminPayoutList> {
  return apiClient<AdminPayoutList>(`/partners/payouts${toQuery(filters)}`);
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

/** "Duyệt chi" or "Từ chối" for the rows an admin ticked (#069). */
export async function bulkPayoutDecision(
  data: BulkPayoutDecisionPayload
): Promise<{ updated: number; skipped: number[] }> {
  return apiClient<{ updated: number; skipped: number[] }>('/partners/payouts/bulk-decision', {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

/** Everything an admin has announced, with how far it reached (#079). */
export async function getNotifications(): Promise<PartnerNotification[]> {
  return apiClient<PartnerNotification[]>('/partners/notifications');
}

/** Compose and send an announcement (#079). */
export async function createNotification(
  data: CreateNotificationPayload
): Promise<PartnerNotification> {
  return apiClient<PartnerNotification>('/partners/notifications', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/** The partner programme's settings (#075, #076, #077). */
export async function getProgramSettings(): Promise<PartnerProgramSettings> {
  return apiClient<PartnerProgramSettings>('/partners/program-settings');
}

export async function updateProgramSettings(
  data: UpdateProgramSettingsPayload
): Promise<PartnerProgramSettings> {
  return apiClient<PartnerProgramSettings>('/partners/program-settings', {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

/** "Đơn hàng đối tác": the partner screens, with the scope opened up (#071). */
export async function getPartnerOrders<T>(filters: PartnerOrderFilters): Promise<T[]> {
  return apiClient<T[]>(`/partners/orders${toQuery(filters)}`);
}

/** The names for the "lọc theo đối tác" select box (#071). */
export async function getPartnerOptions(partnerType?: string): Promise<PartnerOption[]> {
  return apiClient<PartnerOption[]>(`/partners/orders/partner-options${toQuery({ partnerType })}`);
}

/** The four figures at the head of "Tài chính" (#067). */
export async function getPayoutSummary(): Promise<PayoutSummary> {
  return apiClient<PayoutSummary>('/partners/payouts/summary');
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

/** The partner page's figures over the chosen period (doitac-1410 #004). */
export async function getPartnerStats(
  id: number,
  range: { from?: string; to?: string }
): Promise<PartnerAdminStats> {
  return apiClient<PartnerAdminStats>(`/partners/${id}/stats${toQuery(range)}`);
}

/** The wallet popup's "Thông tin" tab (doitac-1410 #004). */
export async function getPartnerWallet(id: number): Promise<PartnerWalletSummary> {
  return apiClient<PartnerWalletSummary>(`/partners/${id}/wallet`);
}

/** Deposits and admin adjustments only — the popup's history tab (doitac-1410 #004). */
export async function getPartnerWalletHistory(id: number): Promise<PartnerWalletTransaction[]> {
  return apiClient<PartnerWalletTransaction[]>(`/partners/${id}/wallet/transactions`);
}

/** Freeze or release the wallet on its own (doitac-1410 #004). */
export async function setPartnerWalletLocked(
  id: number,
  locked: boolean
): Promise<PartnerWalletSummary> {
  return apiClient<PartnerWalletSummary>(`/partners/${id}/wallet/status`, {
    method: 'PATCH',
    body: JSON.stringify({ locked })
  });
}

/** Deposit promotions (doitac-1410 #015). */
export async function getDepositPromotions(): Promise<DepositPromotion[]> {
  return apiClient<DepositPromotion[]>('/partners/deposit-promotions');
}

export async function saveDepositPromotion(
  id: number | null,
  data: DepositPromotionPayload
): Promise<DepositPromotion> {
  return apiClient<DepositPromotion>(
    id ? `/partners/deposit-promotions/${id}` : '/partners/deposit-promotions',
    { method: id ? 'PATCH' : 'POST', body: JSON.stringify(data) }
  );
}

export async function deleteDepositPromotion(id: number): Promise<void> {
  await apiClient(`/partners/deposit-promotions/${id}`, { method: 'DELETE' });
}

/** The figures on top of "Tiếp thị liên kết" (doitac-1410 #051). */
export async function getAdminLinkStats(range?: {
  from?: string;
  to?: string;
}): Promise<AdminLinkStats> {
  const search = new URLSearchParams();
  if (range?.from) search.set('from', range.from);
  if (range?.to) search.set('to', range.to);
  const qs = search.toString();
  return apiClient<AdminLinkStats>(`/partners/links/stats${qs ? `?${qs}` : ''}`);
}

/** Every partner's links, filtered (doitac-1410 #052). */
export async function getAdminLinks(filters: AdminLinkFilters = {}): Promise<AdminLinkList> {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '' && value !== 'all') search.set(key, String(value));
  }
  const qs = search.toString();
  return apiClient<AdminLinkList>(`/partners/links${qs ? `?${qs}` : ''}`);
}

/** "Thay đổi trạng thái" for the ticked links (doitac-1410 #053). */
export async function bulkLinkStatus(payload: {
  linkIds: number[];
  action: 'suspend' | 'unsuspend' | 'restore';
  reason: string;
  internalNote?: string;
}): Promise<{ done: number[]; skipped: { id: number; reason: string }[] }> {
  return apiClient(`/partners/links/bulk-status`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

/** Where the browser downloads the link list, with its filters (doitac-1410 #053). */
export function adminLinksExportUrl(filters: AdminLinkFilters = {}): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (key === 'page' || key === 'limit') continue;
    if (value !== undefined && value !== '' && value !== 'all') search.set(key, String(value));
  }
  const qs = search.toString();
  return `/api/partners/links/export-excel${qs ? `?${qs}` : ''}`;
}

/** One link with its history, for "Xem chi tiết" (doitac-1410 #054). */
export async function getAdminLinkDetail(linkId: number): Promise<AdminLinkDetail> {
  return apiClient<AdminLinkDetail>(`/partners/links/${linkId}`);
}

/** "Thêm ghi chú nội bộ" on a link (doitac-1410 #055). */
export async function addLinkNote(linkId: number, body: string): Promise<unknown> {
  return apiClient(`/partners/links/${linkId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ body })
  });
}

/** "Xem chi tiết" of a partner order (doitac-1410 #058). */
export async function getAdminPartnerOrderDetail<T>(
  orderNumber: string,
  partnerType: 'kol' | 'distribution'
): Promise<T> {
  return apiClient<T>(
    `/partners/orders/${encodeURIComponent(orderNumber)}/detail${toQuery({ partnerType })}`
  );
}

/** "Hoàn tiền" on a distribution partner's order, back to their wallet (#058). */
export async function refundPartnerPurchase(
  orderNumber: string,
  payload: { iccids?: string[]; itemIds?: number[]; reason: string }
): Promise<{ refundedVnd: number; esims: string[] }> {
  return apiClient(`/partners/orders/${encodeURIComponent(orderNumber)}/refund`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/** "Sửa" a sent announcement (doitac-1410 #062). */
export async function updateNotification(
  id: number,
  data: UpdateNotificationPayload
): Promise<PartnerNotification> {
  return apiClient<PartnerNotification>(`/partners/notifications/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

/** "Xóa" a sent announcement (doitac-1410 #062). */
export async function deleteNotification(id: number): Promise<{ ok: true }> {
  return apiClient<{ ok: true }>(`/partners/notifications/${id}`, { method: 'DELETE' });
}
