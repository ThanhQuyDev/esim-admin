import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import type { AdminLinkFilters } from './types';
import {
  getPartners,
  getPartner,
  getPartnerMarketing,
  getPartnerStats,
  getDepositPromotions,
  getPartnerWallet,
  getPartnerWalletHistory,
  getDepositRequests,
  getCommissions,
  getPayouts,
  getTiers,
  getPartnerOverview,
  getPartnerRevenueByType,
  getPartnerActivityByType,
  getPartnerSeriesByType,
  getPartnerTopDestinations,
  getTopPartners,
  getPartnerListStats,
  getPartnerPerformance,
  getCommissionSummary,
  getNotifications,
  getProgramSettings,
  getPartnerOrders,
  getPartnerOptions,
  getPayoutSummary,
  getReconciliations,
  getAdminLinkStats,
  getAdminLinks
} from './service';
import type {
  PartnerFilters,
  CommissionFilters,
  PayoutFilters,
  PartnerOrderFilters
} from './types';

export const partnerKeys = {
  all: ['partners'] as const,
  list: (filters: PartnerFilters) => [...partnerKeys.all, 'list', filters] as const,
  detail: (id: number) => [...partnerKeys.all, 'detail', id] as const,
  depositRequests: (status?: string) => [...partnerKeys.all, 'deposit-requests', status] as const,
  commissions: (filters: Record<string, unknown>) =>
    [...partnerKeys.all, 'commissions', filters] as const,
  payouts: (status?: string) => [...partnerKeys.all, 'payouts', status] as const,
  tiers: () => [...partnerKeys.all, 'tiers'] as const
};

export const partnersQueryOptions = (filters: PartnerFilters) =>
  queryOptions({
    queryKey: partnerKeys.list(filters),
    queryFn: () => getPartners(filters)
  });

export const partnerQueryOptions = (id: number) =>
  queryOptions({
    queryKey: partnerKeys.detail(id),
    queryFn: () => getPartner(id)
  });

export const depositRequestsQueryOptions = (status?: string) =>
  queryOptions({
    queryKey: partnerKeys.depositRequests(status),
    queryFn: () => getDepositRequests(status)
  });

export const commissionsQueryOptions = (filters: CommissionFilters) =>
  queryOptions({
    queryKey: partnerKeys.commissions(filters),
    queryFn: () => getCommissions(filters)
  });

export const payoutsQueryOptions = (filters: PayoutFilters = {}) =>
  queryOptions({
    queryKey: [...partnerKeys.payouts(filters.status), filters],
    queryFn: () => getPayouts(filters)
  });

export const tiersQueryOptions = () =>
  queryOptions({
    queryKey: partnerKeys.tiers(),
    queryFn: () => getTiers()
  });

export const partnerOverviewQueryOptions = () =>
  queryOptions({ queryKey: [...partnerKeys.all, 'overview'], queryFn: getPartnerOverview });

/** Revenue and orders over time, split by partner type (#052). */
export const partnerSeriesByTypeQueryOptions = (params?: {
  from?: string;
  to?: string;
  groupBy?: string;
}) =>
  queryOptions({
    queryKey: [
      ...partnerKeys.all,
      'series-by-type',
      params?.from ?? '',
      params?.to ?? '',
      params?.groupBy ?? 'day'
    ],
    queryFn: () => getPartnerSeriesByType(params)
  });

/** Link and code performance over the last 30 days (#061). */
export const partnerPerformanceQueryOptions = (id: number) =>
  queryOptions({
    queryKey: [...partnerKeys.detail(id), 'performance'],
    queryFn: () => getPartnerPerformance(id)
  });

/** Everything an admin has announced (#079). */
export const notificationsQueryOptions = () =>
  queryOptions({
    queryKey: [...partnerKeys.all, 'notifications'],
    queryFn: () => getNotifications()
  });

/** The partner programme's settings (#075, #076, #077). */
export const programSettingsQueryOptions = () =>
  queryOptions({
    queryKey: [...partnerKeys.all, 'program-settings'],
    queryFn: () => getProgramSettings()
  });

/** "Đơn hàng đối tác": the partner screens, with the scope opened up (#071). */
export const partnerOrdersQueryOptions = <T>(filters: PartnerOrderFilters) =>
  queryOptions({
    queryKey: [...partnerKeys.all, 'orders', filters],
    queryFn: () => getPartnerOrders<T>(filters)
  });

/** The names for the "lọc theo đối tác" select box (#071). */
export const partnerOptionsQueryOptions = (partnerType?: string) =>
  queryOptions({
    queryKey: [...partnerKeys.all, 'partner-options', partnerType ?? ''],
    queryFn: () => getPartnerOptions(partnerType)
  });

/** The four figures at the head of "Tài chính" (#067). */
export const payoutSummaryQueryOptions = () =>
  queryOptions({
    queryKey: [...partnerKeys.all, 'payout-summary'],
    queryFn: () => getPayoutSummary()
  });

/** The reconciliation list: one row per partner for one period (#065). */
export const reconciliationsQueryOptions = (params: {
  period?: string;
  search?: string;
  status?: string;
}) =>
  queryOptions({
    queryKey: [
      ...partnerKeys.all,
      'reconciliations',
      params.period ?? '',
      params.search ?? '',
      params.status ?? ''
    ],
    queryFn: () => getReconciliations(params)
  });

/** The five figures at the head of "Hoa hồng & Đối soát" (#063). */
export const commissionSummaryQueryOptions = () =>
  queryOptions({
    queryKey: [...partnerKeys.all, 'commission-summary'],
    queryFn: getCommissionSummary
  });

/** The four figures at the head of the partner list (#057). */
export const partnerListStatsQueryOptions = () =>
  queryOptions({
    queryKey: [...partnerKeys.all, 'list-stats'],
    queryFn: getPartnerListStats
  });

/** The partners bringing in the most, for the foot of the overview (#054). */
export const topPartnersQueryOptions = (params?: { from?: string; to?: string; limit?: number }) =>
  queryOptions({
    queryKey: [
      ...partnerKeys.all,
      'top-partners',
      params?.from ?? '',
      params?.to ?? '',
      params?.limit ?? 30
    ],
    queryFn: () => getTopPartners(params)
  });

/** Where partner-driven orders are going (#052). */
export const partnerTopDestinationsQueryOptions = (range?: { from?: string; to?: string }) =>
  queryOptions({
    queryKey: [...partnerKeys.all, 'top-destinations', range?.from ?? '', range?.to ?? ''],
    queryFn: () => getPartnerTopDestinations(range)
  });

/** Orders, live partners and settlement queue, split by partner type (#051). */
export const partnerActivityByTypeQueryOptions = (range?: { from?: string; to?: string }) =>
  queryOptions({
    queryKey: [...partnerKeys.all, 'activity-by-type', range?.from ?? '', range?.to ?? ''],
    queryFn: () => getPartnerActivityByType(range)
  });

/** Revenue esim.vn keeps, split by partner type (#050). */
export const partnerRevenueByTypeQueryOptions = (range?: { from?: string; to?: string }) =>
  queryOptions({
    queryKey: [...partnerKeys.all, 'revenue-by-type', range?.from ?? '', range?.to ?? ''],
    queryFn: () => getPartnerRevenueByType(range)
  });

/** One partner's links and discount codes, for the admin detail screen (#095). */
export const partnerMarketingQueryOptions = (id: number) =>
  queryOptions({
    queryKey: [...partnerKeys.detail(id), 'marketing'],
    queryFn: () => getPartnerMarketing(id)
  });

/** The partner page's figures over the chosen period (doitac-1410 #004). */
export const partnerStatsQueryOptions = (id: number, range: { from?: string; to?: string }) =>
  queryOptions({
    queryKey: [...partnerKeys.detail(id), 'stats', range.from ?? '', range.to ?? ''],
    queryFn: () => getPartnerStats(id, range)
  });

/** The wallet popup's two tabs (doitac-1410 #004). */
export const partnerWalletQueryOptions = (id: number) =>
  queryOptions({
    queryKey: [...partnerKeys.detail(id), 'wallet'],
    queryFn: () => getPartnerWallet(id)
  });

export const partnerWalletHistoryQueryOptions = (id: number) =>
  queryOptions({
    queryKey: [...partnerKeys.detail(id), 'wallet', 'history'],
    queryFn: () => getPartnerWalletHistory(id)
  });

/** Deposit promotions (doitac-1410 #015). */
export const depositPromotionsQueryOptions = () =>
  queryOptions({
    queryKey: [...partnerKeys.all, 'deposit-promotions'],
    queryFn: () => getDepositPromotions()
  });

/** The figures on top of "Tiếp thị liên kết" (doitac-1410 #051). */
export const adminLinkStatsQueryOptions = (range?: { from?: string; to?: string }) =>
  queryOptions({
    queryKey: [...partnerKeys.all, 'link-stats', range?.from ?? '', range?.to ?? ''],
    queryFn: () => getAdminLinkStats(range)
  });

/** Every partner's links, filtered (doitac-1410 #052). */
export const adminLinksQueryOptions = (filters: AdminLinkFilters) =>
  queryOptions({
    queryKey: [...partnerKeys.all, 'links', filters],
    queryFn: () => getAdminLinks(filters),
    placeholderData: keepPreviousData
  });
