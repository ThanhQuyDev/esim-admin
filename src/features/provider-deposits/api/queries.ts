import { queryOptions } from '@tanstack/react-query';
import { getProviderDepositEntries, getProviderDepositSummary } from './service';
import type { ProviderDepositEntryFilters } from './types';

export const providerDepositKeys = {
  all: ['provider-deposits'] as const,
  summary: () => [...providerDepositKeys.all, 'summary'] as const,
  entries: (filters: ProviderDepositEntryFilters) =>
    [...providerDepositKeys.all, 'entries', filters] as const
};

export const providerDepositSummaryQueryOptions = () =>
  queryOptions({
    queryKey: providerDepositKeys.summary(),
    queryFn: () => getProviderDepositSummary()
  });

export const providerDepositEntriesQueryOptions = (filters: ProviderDepositEntryFilters) =>
  queryOptions({
    queryKey: providerDepositKeys.entries(filters),
    queryFn: () => getProviderDepositEntries(filters)
  });
