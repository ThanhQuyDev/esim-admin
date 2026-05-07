export type OverviewProvider = 'airalo' | 'esimaccess' | 'gadgetkorea';

export type ProviderMetric = 'orders' | 'revenue' | 'plansSold' | 'successRate';
export type ProviderGroupBy = 'day' | 'week' | 'month' | 'provider';
export type FinancialGroupBy = 'day' | 'week' | 'month' | 'provider' | 'destination';

export interface OverviewFilters {
  from?: string;
  to?: string;
  provider?: OverviewProvider;
}

export interface OverviewSummary {
  totalOrders: number;
  totalRevenue: number;
  totalPlansSold: number;
  totalUsers: number;
  activePlans: number;
  failedOrders: number;
}

export interface ProviderComparisonQuery extends Pick<OverviewFilters, 'from' | 'to'> {
  metric?: ProviderMetric;
  groupBy?: ProviderGroupBy;
}

export interface ProviderComparisonByProviderResponse {
  data: Array<{
    provider: string;
    orders: number;
    revenue: number;
    plansSold: number;
    successRate: number;
  }>;
}

export interface ProviderComparisonSeriesResponse {
  providers: string[];
  series: Array<
    {
      date: string;
    } & Record<string, string | number>
  >;
}

export type ProviderComparisonResponse =
  | ProviderComparisonByProviderResponse
  | ProviderComparisonSeriesResponse;

export interface TopDestinationsQuery extends OverviewFilters {
  limit?: number;
}

export interface TopDestinationsResponse {
  data: Array<{
    destinationId?: number;
    destinationName: string;
    plansPurchased: number;
    revenue: number;
  }>;
}

export interface FinancialComparisonQuery extends OverviewFilters {
  groupBy?: FinancialGroupBy;
  limit?: number;
}

export interface FinancialTotals {
  costPrice: number;
  totalRevenue: number;
  profit: number;
  profitMarginPercent: number;
}

export interface FinancialComparisonSeriesResponse {
  series: Array<{
    date: string;
    costPrice: number;
    totalRevenue: number;
    profit: number;
  }>;
  totals: FinancialTotals;
}

export interface FinancialComparisonGroupedResponse {
  data: Array<{
    group: string;
    costPrice: number;
    totalRevenue: number;
    profit: number;
    profitMarginPercent: number;
  }>;
  totals: FinancialTotals;
}

export type FinancialComparisonResponse =
  | FinancialComparisonSeriesResponse
  | FinancialComparisonGroupedResponse;

export interface OverviewResponse {
  summary: OverviewSummary;
  providerComparison: ProviderComparisonResponse;
  topDestinations: TopDestinationsResponse;
  financialComparison: FinancialComparisonResponse;
}
