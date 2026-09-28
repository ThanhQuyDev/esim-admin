import { queryOptions } from '@tanstack/react-query';
import {
  getPartners,
  getPartner,
  getPartnerMarketing,
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
  getReconciliations
} from './service';
import type { PartnerFilters, CommissionFilters } from './types';

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

export const payoutsQueryOptions = (status?: string) =>
  queryOptions({
    queryKey: partnerKeys.payouts(status),
    queryFn: () => getPayouts(status)
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
