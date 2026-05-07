import { queryOptions } from '@tanstack/react-query';
import {
  getFinancialComparison,
  getOverview,
  getOverviewSummary,
  getProviderComparison,
  getTopDestinations
} from './service';
import type {
  FinancialComparisonQuery,
  OverviewFilters,
  ProviderComparisonQuery,
  TopDestinationsQuery
} from './types';

export const overviewKeys = {
  all: ['overview'] as const,
  root: (filters: OverviewFilters) => [...overviewKeys.all, 'root', filters] as const,
  summary: (filters: OverviewFilters) => [...overviewKeys.all, 'summary', filters] as const,
  providerComparison: (query: ProviderComparisonQuery) =>
    [...overviewKeys.all, 'provider-comparison', query] as const,
  topDestinations: (query: TopDestinationsQuery) =>
    [...overviewKeys.all, 'top-destinations', query] as const,
  financialComparison: (query: FinancialComparisonQuery) =>
    [...overviewKeys.all, 'financial-comparison', query] as const
};

export const overviewQueryOptions = (filters: OverviewFilters = {}) =>
  queryOptions({
    queryKey: overviewKeys.root(filters),
    queryFn: () => getOverview(filters)
  });

export const overviewSummaryQueryOptions = (filters: OverviewFilters = {}) =>
  queryOptions({
    queryKey: overviewKeys.summary(filters),
    queryFn: () => getOverviewSummary(filters)
  });

export const providerComparisonQueryOptions = (query: ProviderComparisonQuery = {}) =>
  queryOptions({
    queryKey: overviewKeys.providerComparison(query),
    queryFn: () => getProviderComparison(query)
  });

export const topDestinationsQueryOptions = (query: TopDestinationsQuery = {}) =>
  queryOptions({
    queryKey: overviewKeys.topDestinations(query),
    queryFn: () => getTopDestinations(query)
  });

export const financialComparisonQueryOptions = (query: FinancialComparisonQuery = {}) =>
  queryOptions({
    queryKey: overviewKeys.financialComparison(query),
    queryFn: () => getFinancialComparison(query)
  });
