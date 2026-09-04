import { queryOptions } from '@tanstack/react-query';
import {
  getMyPartner,
  getMyWallet,
  getMyWalletTransactions,
  getMyDepositRequests,
  getMyLinks,
  getMyCommissions,
  getMyPayouts
} from './service';

export const partnerPortalKeys = {
  all: ['partner-portal'] as const,
  me: () => [...partnerPortalKeys.all, 'me'] as const,
  wallet: () => [...partnerPortalKeys.all, 'wallet'] as const,
  walletTransactions: () => [...partnerPortalKeys.all, 'wallet', 'transactions'] as const,
  depositRequests: () => [...partnerPortalKeys.all, 'deposit-requests'] as const,
  links: () => [...partnerPortalKeys.all, 'links'] as const,
  commissions: () => [...partnerPortalKeys.all, 'commissions'] as const,
  payouts: () => [...partnerPortalKeys.all, 'payouts'] as const
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
