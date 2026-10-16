import { apiClient } from '@/lib/api-client';
import type {
  CartPurchaseResult,
  CartQuote,
  CatalogueFilters,
  MyLedgerFilters,
  MyLedgerRow,
  MyPartner,
  UpdateMyProfilePayload,
  MyWalletSummary,
  MyWalletTransaction,
  MyDepositRequest,
  CreateDepositRequestPayload,
  MyLink,
  MyLinkDetail,
  MyChannelPerformance,
  MyLinksQuery,
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
  MyOrderDetail,
  CreateCouponPayload,
  TicketMessage,
  BankAccountChangePayload,
  BankAccountChangeRequested,
  MyDistributionSummary,
  MyDistributionSeriesPoint,
  MyEsim,
  MyPurchase,
  PartnerCatalogue,
  PurchaseQuote,
  CreatePurchasePayload,
  PurchaseResult,
  EsimFaultReport,
  ReportEsimFaultPayload,
  MyNotificationList
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

/** One order with its attribution timeline (#026). */
export async function getMyOrderDetail(orderNumber: string): Promise<MyOrderDetail> {
  return apiClient<MyOrderDetail>(`/partner-portal/orders/${encodeURIComponent(orderNumber)}`);
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

export async function getMyLinks(query: MyLinksQuery = {}): Promise<MyLink[]> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return apiClient<MyLink[]>(`/partner-portal/links${qs ? `?${qs}` : ''}`);
}

/** One link, its timeline and history (doitac-1410 #018). */
export async function getMyLinkDetail(
  id: number,
  range: { from?: string; to?: string } = {}
): Promise<MyLinkDetail> {
  const params = new URLSearchParams();
  if (range.from) params.set('from', range.from);
  if (range.to) params.set('to', range.to);
  const qs = params.toString();
  return apiClient<MyLinkDetail>(`/partner-portal/links/${id}/detail${qs ? `?${qs}` : ''}`);
}

/** Bring back a link deleted within 30 days (doitac-1410 #018). */
export async function restoreMyLink(id: number): Promise<MyLink> {
  return apiClient<MyLink>(`/partner-portal/links/${id}/restore`, { method: 'POST' });
}

/** Ask esim.vn to restore a deleted link (doitac-1410 #019). */
export async function requestMyLinkRestore(id: number, reason: string): Promise<MyLink> {
  return apiClient<MyLink>(`/partner-portal/links/${id}/restore-request`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
}

/** "Hiệu suất theo kênh" over a window (doitac-1410 #019). */
export async function getMyChannelPerformance(
  range: { from?: string; to?: string } = {}
): Promise<MyChannelPerformance> {
  const params = new URLSearchParams();
  if (range.from) params.set('from', range.from);
  if (range.to) params.set('to', range.to);
  const qs = params.toString();
  return apiClient<MyChannelPerformance>(`/partner-portal/links-channels${qs ? `?${qs}` : ''}`);
}

/** Record the appeal of a suspended link, with its ticket (doitac-1410 #018). */
export async function appealMyLink(id: number, ticketId?: number): Promise<MyLink> {
  return apiClient<MyLink>(`/partner-portal/links/${id}/appeal`, {
    method: 'POST',
    body: JSON.stringify(ticketId ? { ticketId } : {})
  });
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

/** Download the order list as a spreadsheet (#027). */
export async function exportMyOrders(): Promise<void> {
  await downloadPortalFile('/api/partner-portal/orders/export', 'don-hang-doi-tac.xlsx');
}

/** Download the link list as a spreadsheet (#017). */
export async function exportMyLinks(): Promise<void> {
  await downloadPortalFile('/api/partner-portal/links/export', 'link-tiep-thi.xlsx');
}

/** Fetch a file the API generated and hand it to the browser as a download. */
async function downloadPortalFile(url: string, fallbackName: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Không tải được file.');
  }

  const blob = await res.blob();
  const disposition = res.headers.get('content-disposition');
  const filename = disposition?.match(/filename="?([^"]+)"?/)?.[1] || fallbackName;

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
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

export async function getMyDistributionSummary(range?: {
  from?: string;
  to?: string;
}): Promise<MyDistributionSummary> {
  const search = new URLSearchParams();
  if (range?.from) search.set('from', range.from);
  if (range?.to) search.set('to', range.to);
  const query = search.toString();
  return apiClient<MyDistributionSummary>(
    `/partner-portal/distribution-summary${query ? `?${query}` : ''}`
  );
}

export async function getMyDistributionSeries(params?: {
  from?: string;
  to?: string;
  groupBy?: string;
}): Promise<MyDistributionSeriesPoint[]> {
  const search = new URLSearchParams();
  if (params?.from) search.set('from', params.from);
  if (params?.to) search.set('to', params.to);
  if (params?.groupBy) search.set('groupBy', params.groupBy);
  const query = search.toString();
  return apiClient<MyDistributionSeriesPoint[]>(
    `/partner-portal/distribution-series${query ? `?${query}` : ''}`
  );
}

function listQuery(filters?: { search?: string; status?: string; limit?: number }) {
  const search = new URLSearchParams();
  if (filters?.search) search.set('search', filters.search);
  if (filters?.status) search.set('status', filters.status);
  if (filters?.limit) search.set('limit', String(filters.limit));
  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function getMyEsims(filters?: {
  search?: string;
  status?: string;
  limit?: number;
  /** doitac-1410 #037 */
  planType?: string;
  topUp?: string;
  from?: string;
  to?: string;
}): Promise<MyEsim[]> {
  const params = new URLSearchParams(listQuery(filters).replace(/^\?/, ''));
  // Plan type, top-up and the created range (doitac-1410 #037).
  for (const key of ['planType', 'topUp', 'from', 'to'] as const) {
    const value = filters?.[key];
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return apiClient<MyEsim[]>(`/partner-portal/esims${query ? `?${query}` : ''}`);
}

export async function getMyPurchases(filters?: {
  search?: string;
  status?: string;
  limit?: number;
}): Promise<MyPurchase[]> {
  return apiClient<MyPurchase[]>(`/partner-portal/purchases${listQuery(filters)}`);
}

/** Bảng giá đối tác phân phối — "Sản phẩm & bảng giá" (#046). */
export async function getPartnerCatalogue(
  filters: CatalogueFilters = {}
): Promise<PartnerCatalogue> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '' && value !== 'all') params.set(key, String(value));
  }
  const query = params.toString();
  return apiClient<PartnerCatalogue>(`/partner-portal/catalogue${query ? `?${query}` : ''}`);
}

/** The price list's "Điểm đến" options (doitac-1410 #033). */
export async function getCatalogueLocations(): Promise<{ value: string; label: string }[]> {
  return apiClient<{ value: string; label: string }[]>('/partner-portal/catalogue/locations');
}

/** Số tiền sẽ bị trừ, tính trước khi bấm mua (#046). */
export async function getPurchaseQuote(planId: number, quantity: number): Promise<PurchaseQuote> {
  return apiClient<PurchaseQuote>(
    `/partner-portal/purchases/quote?planId=${planId}&quantity=${quantity}`
  );
}

/** Đặt mua và trừ ví ngay (#046). */
export async function createPurchase(payload: CreatePurchasePayload): Promise<PurchaseResult> {
  return apiClient<PurchaseResult>('/partner-portal/purchases', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/** Đối tác tự huỷ đơn chưa cấp eSIM (#046, A5). */
export async function cancelPurchase(
  orderNumber: string
): Promise<{ orderNumber: string; refundedVnd: number }> {
  return apiClient<{ orderNumber: string; refundedVnd: number }>(
    `/partner-portal/purchases/${encodeURIComponent(orderNumber)}/cancel`,
    { method: 'POST' }
  );
}

/** Các phiếu báo eSIM lỗi của chính đối tác này (#046, A4). */
export async function getMyEsimFaults(): Promise<EsimFaultReport[]> {
  return apiClient<EsimFaultReport[]>('/partner-portal/esim-faults');
}

/** Báo một eSIM đã mua bị lỗi — admin duyệt tay mới hoàn tiền (#046, A4). */
export async function reportEsimFault(payload: ReportEsimFaultPayload): Promise<EsimFaultReport> {
  return apiClient<EsimFaultReport>('/partner-portal/esim-faults', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function getMyOrders(): Promise<MyOrder[]> {
  return apiClient<MyOrder[]>('/partner-portal/orders');
}

export async function getMyTiers(): Promise<PartnerTier[]> {
  return apiClient<PartnerTier[]>('/partner-portal/tiers');
}

/** Upload one attachment and get back the URL to store on the ticket (#032). */
export async function uploadAttachment(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch('/api/files/upload', { method: 'POST', body: form });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Không tải được tệp lên.');
  }

  const { url } = (await res.json()) as { url: string };
  return url;
}

/** The conversation on one support ticket (#032). */
export async function getTicketMessages(ticketId: number): Promise<TicketMessage[]> {
  const res = await fetch(`/api/partner-portal/tickets/${ticketId}/messages`);
  if (!res.ok) throw new Error('Không tải được nội dung trao đổi.');
  return res.json();
}

export async function replyToTicket(
  ticketId: number,
  body: string,
  attachments: string[] = []
): Promise<TicketMessage> {
  const res = await fetch(`/api/partner-portal/tickets/${ticketId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body, attachments })
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Không gửi được phản hồi.');
  }
  return res.json();
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

/** Create a discount code funded by the partner's own commission (#028). */
export async function createMyCoupon(data: CreateCouponPayload): Promise<{
  id: number;
  code: string;
  discountPercent: number;
  commissionPercent: number;
  keptPercent: number;
}> {
  return apiClient('/partner-portal/coupons', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function setMyCouponActive(id: number, isActive: boolean): Promise<void> {
  await apiClient(`/partner-portal/coupons/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive })
  });
}

export async function getMyCoupons(): Promise<MyCoupon[]> {
  return apiClient<MyCoupon[]>('/partner-portal/coupons');
}

export async function getMyTierEvaluations(): Promise<MyTierEvaluation[]> {
  return apiClient<MyTierEvaluation[]>('/partner-portal/tier-evaluations');
}

/** Announcements from esim.vn, for the bell (#079). */
export async function getMyNotifications(limit?: number): Promise<MyNotificationList> {
  return apiClient<MyNotificationList>(
    `/partner-portal/notifications${limit ? `?limit=${limit}` : ''}`
  );
}

export async function markMyNotificationRead(id: number): Promise<void> {
  await apiClient(`/partner-portal/notifications/${id}/read`, { method: 'POST' });
}

export async function markAllMyNotificationsRead(): Promise<void> {
  await apiClient('/partner-portal/notifications/read-all', { method: 'POST' });
}

/** "Lịch sử giao dịch" with its filters (doitac-1410 #031). */
export async function getMyLedger(filters: MyLedgerFilters = {}): Promise<MyLedgerRow[]> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return apiClient<MyLedgerRow[]>(`/partner-portal/wallet/ledger${qs ? `?${qs}` : ''}`);
}

/** Where the browser downloads the same view as a spreadsheet (doitac-1410 #031). */
export function myLedgerExportUrl(filters: MyLedgerFilters = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return `/api/partner-portal/wallet/ledger/export${qs ? `?${qs}` : ''}`;
}

/** Báo giá cả giỏ hàng (doitac-1410 #035). */
export async function quoteCart(items: { planId: number; quantity: number }[]): Promise<CartQuote> {
  return apiClient<CartQuote>('/partner-portal/purchases/cart/quote', {
    method: 'POST',
    body: JSON.stringify({ items })
  });
}

/** Thanh toán cả giỏ hàng trong một đơn (doitac-1410 #035). */
export async function purchaseCart(payload: {
  items: { planId: number; quantity: number }[];
  recipientEmail?: string;
}): Promise<CartPurchaseResult> {
  return apiClient<CartPurchaseResult>('/partner-portal/purchases/cart', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/** Where the browser downloads the price list (doitac-1410 #035). */
export function catalogueExportUrl(filters: CatalogueFilters = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (key === 'limit') continue;
    if (value !== undefined && value !== '' && value !== 'all') params.set(key, String(value));
  }
  const qs = params.toString();
  return `/api/partner-portal/catalogue/export${qs ? `?${qs}` : ''}`;
}
