import { apiClient } from '@/lib/api-client';
import type {
  FinancialComparisonQuery,
  FinancialComparisonResponse,
  OverviewFilters,
  OverviewResponse,
  OverviewSummary,
  ProviderComparisonQuery,
  ProviderComparisonResponse,
  TopDestinationsQuery,
  TopDestinationsResponse
} from './types';

type QueryValue = string | number | undefined;

function buildOverviewQuery<T extends object>(query: T) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    const queryValue = value as QueryValue;
    if (queryValue === undefined || queryValue === '') return;
    params.set(key, String(queryValue));
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

export async function getOverview(filters: OverviewFilters = {}): Promise<OverviewResponse> {
  return apiClient<OverviewResponse>(`/overview${buildOverviewQuery(filters)}`);
}

export async function getOverviewSummary(filters: OverviewFilters = {}): Promise<OverviewSummary> {
  return apiClient<OverviewSummary>(`/overview/summary${buildOverviewQuery(filters)}`);
}

export async function getProviderComparison(
  query: ProviderComparisonQuery = {}
): Promise<ProviderComparisonResponse> {
  return apiClient<ProviderComparisonResponse>(
    `/overview/provider-comparison${buildOverviewQuery(query)}`
  );
}

export async function getTopDestinations(
  query: TopDestinationsQuery = {}
): Promise<TopDestinationsResponse> {
  return apiClient<TopDestinationsResponse>(
    `/overview/top-destinations${buildOverviewQuery(query)}`
  );
}

export async function getFinancialComparison(
  query: FinancialComparisonQuery = {}
): Promise<FinancialComparisonResponse> {
  return apiClient<FinancialComparisonResponse>(
    `/overview/financial-comparison${buildOverviewQuery(query)}`
  );
}
