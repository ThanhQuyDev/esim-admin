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
  getMyOrders,
  getMyTiers,
  getMyTickets,
  getMyCoupons,
  getMyTierEvaluations
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
  tierEvaluations: () => [...partnerPortalKeys.all, 'tier-evaluations'] as const
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

export const mySummaryQueryOptions = () =>
  queryOptions({ queryKey: partnerPortalKeys.summary(), queryFn: getMySummary });

export const myOrdersQueryOptions = () =>
  queryOptions({ queryKey: partnerPortalKeys.orders(), queryFn: getMyOrders });

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
