import { queryOptions } from '@tanstack/react-query';
import { getWallets, getWallet, getWalletTransactions } from './service';
import type {
  WalletFilters,
  WalletListItem,
  WalletMeResponse,
  WalletTransactionResponse
} from './types';

export type { WalletListItem, WalletMeResponse, WalletTransactionResponse };

export const walletKeys = {
  all: ['wallets'] as const,
  list: (filters: WalletFilters) => [...walletKeys.all, 'list', filters] as const,
  detail: (userId: number) => [...walletKeys.all, 'detail', userId] as const,
  transactions: (userId: number) => [...walletKeys.all, 'transactions', userId] as const
};

export const walletsQueryOptions = (filters: WalletFilters) =>
  queryOptions({
    queryKey: walletKeys.list(filters),
    queryFn: () => getWallets(filters)
  });

export const walletQueryOptions = (userId: number) =>
  queryOptions({
    queryKey: walletKeys.detail(userId),
    queryFn: () => getWallet(userId)
  });

export const walletTransactionsQueryOptions = (userId: number) =>
  queryOptions({
    queryKey: walletKeys.transactions(userId),
    queryFn: () => getWalletTransactions(userId)
  });
