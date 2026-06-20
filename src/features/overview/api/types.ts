export type OverviewProvider =
  | 'airalo'
  | 'esimaccess'
  | 'gadgetkorea'
  | 'japantravelsim'
  | 'viettel';

export type OverviewPreset = 'today' | 'yesterday' | 'last7days' | 'last30days';
export type OverviewGroupBy = 'day' | 'week' | 'month' | 'year';

export type ProviderMetric = 'orders' | 'revenue' | 'plansSold' | 'successRate';
export type ProviderGroupBy = 'day' | 'week' | 'month' | 'year' | 'provider';
export type FinancialGroupBy = 'day' | 'week' | 'month' | 'year' | 'provider' | 'destination';

export interface OverviewFilters {
  preset?: OverviewPreset;
  groupBy?: OverviewGroupBy;
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

export interface ProviderComparisonQuery extends Omit<OverviewFilters, 'groupBy'> {
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

export interface FinancialComparisonQuery extends Omit<OverviewFilters, 'groupBy'> {
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
