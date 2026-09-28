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
  getPartnerRevenueByType
} from './service';
import type { PartnerFilters } from './types';

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

export const commissionsQueryOptions = (filters: {
  page?: number;
  limit?: number;
  partnerId?: number;
  status?: string;
}) =>
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
