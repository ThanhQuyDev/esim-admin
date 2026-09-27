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
  MyOrderDetail,
  CreateCouponPayload,
  TicketMessage,
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
