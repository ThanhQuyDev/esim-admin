import { queryOptions } from '@tanstack/react-query';
import {
  getMyPartner,
  getMyWallet,
  getMyWalletTransactions,
  getMyDepositRequests,
  getMyLinks,
  getMyCommissions,
  getMyPayouts,
  getMySummary,
  getMyTopDestinations,
  getMyOrderDetail,
  getTicketMessages,
  getMyOrders,
  getMyTiers,
  getMyTickets,
  getMyCoupons,
  getMyTierEvaluations,
  getMyNotifications,
  getMyDistributionSummary,
  getMyDistributionSeries,
  getMyEsims,
  getMyPurchases,
  getPartnerCatalogue,
  getPurchaseQuote,
  getMyEsimFaults
} from './service';

export const partnerPortalKeys = {
  all: ['partner-portal'] as const,
  me: () => [...partnerPortalKeys.all, 'me'] as const,
  wallet: () => [...partnerPortalKeys.all, 'wallet'] as const,
  walletTransactions: () => [...partnerPortalKeys.all, 'wallet', 'transactions'] as const,
  depositRequests: () => [...partnerPortalKeys.all, 'deposit-requests'] as const,
  links: () => [...partnerPortalKeys.all, 'links'] as const,
  commissions: () => [...partnerPortalKeys.all, 'commissions'] as const,
  payouts: () => [...partnerPortalKeys.all, 'payouts'] as const,
  summary: () => [...partnerPortalKeys.all, 'summary'] as const,
  orders: () => [...partnerPortalKeys.all, 'orders'] as const,
  tiers: () => [...partnerPortalKeys.all, 'tiers'] as const,
  tickets: () => [...partnerPortalKeys.all, 'tickets'] as const,
  coupons: () => [...partnerPortalKeys.all, 'coupons'] as const,
  tierEvaluations: () => [...partnerPortalKeys.all, 'tier-evaluations'] as const,
  notifications: () => [...partnerPortalKeys.all, 'notifications'] as const
};

export const myProfileQueryOptions = () =>
  queryOptions({ queryKey: partnerPortalKeys.me(), queryFn: getMyPartner, retry: false });

export const myWalletQueryOptions = () =>
  queryOptions({ queryKey: partnerPortalKeys.wallet(), queryFn: getMyWallet });

export const myWalletTransactionsQueryOptions = () =>
  queryOptions({
    queryKey: partnerPortalKeys.walletTransactions(),
    queryFn: () => getMyWalletTransactions()
  });

export const myDepositRequestsQueryOptions = () =>
  queryOptions({ queryKey: partnerPortalKeys.depositRequests(), queryFn: getMyDepositRequests });

export const myLinksQueryOptions = () =>
  queryOptions({ queryKey: partnerPortalKeys.links(), queryFn: getMyLinks });

export const myCommissionsQueryOptions = () =>
  queryOptions({ queryKey: partnerPortalKeys.commissions(), queryFn: () => getMyCommissions() });

export const myPayoutsQueryOptions = () =>
  queryOptions({ queryKey: partnerPortalKeys.payouts(), queryFn: getMyPayouts });

export const mySummaryQueryOptions = (range?: { from?: string; to?: string }) =>
  queryOptions({
    // The window is part of the key: switching period must refetch, not reuse
    // the numbers of the previous one (#010).
    queryKey: [...partnerPortalKeys.summary(), range?.from ?? '', range?.to ?? ''],
    queryFn: () => getMySummary(range)
  });

/** Distribution partner's own dashboard figures (#043). */
export const myDistributionSummaryQueryOptions = (range?: { from?: string; to?: string }) =>
  queryOptions({
    queryKey: [
      ...partnerPortalKeys.all,
      'distribution-summary',
      range?.from ?? '',
      range?.to ?? ''
    ],
    queryFn: () => getMyDistributionSummary(range)
  });

/** Orders bought and eSIMs activated over time (#045). */
export const myDistributionSeriesQueryOptions = (params?: {
  from?: string;
  to?: string;
  groupBy?: string;
}) =>
  queryOptions({
    queryKey: [
      ...partnerPortalKeys.all,
      'distribution-series',
      params?.from ?? '',
      params?.to ?? '',
      params?.groupBy ?? 'day'
    ],
    queryFn: () => getMyDistributionSeries(params)
  });

/** A distribution partner's eSIM stock (#046). */
export const myEsimsQueryOptions = (filters?: {
  search?: string;
  status?: string;
  limit?: number;
}) =>
  queryOptions({
    queryKey: [
      ...partnerPortalKeys.all,
      'esims',
      filters?.search ?? '',
      filters?.status ?? '',
      filters?.limit ?? 0
    ],
    queryFn: () => getMyEsims(filters)
  });

/** Orders a distribution partner placed themselves (#046). */
export const myPurchasesQueryOptions = (filters?: {
  search?: string;
  status?: string;
  limit?: number;
}) =>
  queryOptions({
    queryKey: [
      ...partnerPortalKeys.all,
      'purchases',
      filters?.search ?? '',
      filters?.status ?? '',
      filters?.limit ?? 0
    ],
    queryFn: () => getMyPurchases(filters)
  });

/** Bảng giá đối tác phân phối — "Sản phẩm & bảng giá" (#046). */
export const partnerCatalogueQueryOptions = (filters?: { search?: string; limit?: number }) =>
  queryOptions({
    queryKey: [...partnerPortalKeys.all, 'catalogue', filters?.search ?? '', filters?.limit ?? 0],
    queryFn: () => getPartnerCatalogue(filters)
  });

/**
 * Báo giá một lần mua (#046).
 *
 * `enabled` để màn hình tắt hẳn khi chưa chọn gói hay số lượng — gọi với
 * `quantity = 0` chỉ tốn một vòng để nhận lại lỗi "từ 1 trở lên".
 */
export const purchaseQuoteQueryOptions = (planId: number, quantity: number) =>
  queryOptions({
    queryKey: [...partnerPortalKeys.all, 'purchase-quote', planId, quantity],
    queryFn: () => getPurchaseQuote(planId, quantity),
    enabled: planId > 0 && quantity > 0,
    // Số dư ví đổi theo từng lần mua, nên báo giá cũ không được dùng lại.
    staleTime: 0
  });

export const myTopDestinationsQueryOptions = (range?: { from?: string; to?: string }) =>
  queryOptions({
    queryKey: [...partnerPortalKeys.all, 'top-destinations', range?.from ?? '', range?.to ?? ''],
    queryFn: () => getMyTopDestinations(range)
  });

export const myOrdersQueryOptions = () =>
  queryOptions({ queryKey: partnerPortalKeys.orders(), queryFn: getMyOrders });

export const myOrderDetailQueryOptions = (orderNumber: string | null) =>
  queryOptions({
    queryKey: [...partnerPortalKeys.orders(), 'detail', orderNumber ?? ''],
    queryFn: () => getMyOrderDetail(orderNumber as string),
    enabled: Boolean(orderNumber)
  });

export const ticketMessagesQueryOptions = (ticketId: number | null) =>
  queryOptions({
    queryKey: [...partnerPortalKeys.all, 'ticket-messages', ticketId ?? 0],
    queryFn: () => getTicketMessages(ticketId as number),
    enabled: Boolean(ticketId)
  });

export const myTiersQueryOptions = () =>
  queryOptions({ queryKey: partnerPortalKeys.tiers(), queryFn: getMyTiers });

export const myTicketsQueryOptions = () =>
  queryOptions({ queryKey: partnerPortalKeys.tickets(), queryFn: getMyTickets });

export const myCouponsQueryOptions = () =>
  queryOptions({ queryKey: partnerPortalKeys.coupons(), queryFn: getMyCoupons });

export const myTierEvaluationsQueryOptions = () =>
  queryOptions({
    queryKey: partnerPortalKeys.tierEvaluations(),
    queryFn: getMyTierEvaluations
  });

/** Announcements from esim.vn, for the bell (#079). */
export const myNotificationsQueryOptions = () =>
  queryOptions({
    queryKey: partnerPortalKeys.notifications(),
    queryFn: getMyNotifications
  });

/** Các phiếu báo eSIM lỗi của chính đối tác này (#046, A4). */
export const myEsimFaultsQueryOptions = () =>
  queryOptions({
    queryKey: [...partnerPortalKeys.all, 'esim-faults'],
    queryFn: getMyEsimFaults
  });
