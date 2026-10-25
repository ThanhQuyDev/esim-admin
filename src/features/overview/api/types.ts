export type OverviewProvider =
  | 'airalo'
  | 'esimaccess'
  | 'gadgetkorea'
  | 'microesim'
  | 'billion'
  | 'viettel'
  | 'viettel-noidia'
  | 'itel-noidia'
  | 'wintel-noidia'
  | 'vnsky-noidia';

export type OverviewPreset = 'today' | 'yesterday' | 'last7days' | 'last30days';
export type OverviewGroupBy = 'day' | 'week' | 'month' | 'year';

export type ProviderMetric = 'orders' | 'revenue' | 'plansSold' | 'successRate';
export type ProviderGroupBy = 'day' | 'week' | 'month' | 'year' | 'provider';
export type FinancialGroupBy =
  | 'day'
  | 'week'
  | 'month'
  | 'year'
  | 'provider'
  | 'destination'
  /** Direct / partner-referred / partner wallet orders (vande #016). */
  | 'orderSource';

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

/** Successful orders per device (doitac-1410 #083). */
export type OrderDeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown';

export interface OrdersByDeviceResponse {
  data: Array<{ deviceType: OrderDeviceType; orders: number; percent: number }>;
  total: number;
}

export interface FinancialComparisonQuery extends Omit<OverviewFilters, 'groupBy'> {
  groupBy?: FinancialGroupBy;
  limit?: number;
}

export interface FinancialTotals {
  costPrice: number;
  totalRevenue: number;
  /** Partner commission still owed on these sales (vande #016). */
  partnerCommission: number;
  /** Revenue − cost − partner commission. */
  profit: number;
  profitMarginPercent: number;
  /** Plans delivered behind these figures; refunded products excluded. */
  plansSold: number;
}

export interface FinancialComparisonSeriesResponse {
  series: Array<{
    date: string;
    costPrice: number;
    totalRevenue: number;
    partnerCommission: number;
    profit: number;
    plansSold: number;
  }>;
  totals: FinancialTotals;
}

export interface FinancialComparisonGroupedResponse {
  data: Array<{
    group: string;
    /** groupBy=orderSource only. */
    orders?: number;
    costPrice: number;
    totalRevenue: number;
    partnerCommission: number;
    profit: number;
    profitMarginPercent: number;
    plansSold: number;
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

/** The five KPI cards of Tổng quan (vande #059). */
export type OverviewKpis = {
  revenue: {
    netRevenueVnd: number;
    costVnd: number;
    partnerCommissionVnd: number;
    grossProfitVnd: number;
  };
  orders: {
    paidOrders: number;
    esimsSold: number;
    visits: number;
    /** Paid orders ÷ visits; null before any visit was recorded. */
    conversionPercent: number | null;
  };
  partners: { active: number; kol: number; distribution: number; pending: number };
  payouts: {
    pendingVnd: number;
    pendingPartners: number;
    commissionPendingVnd: number;
    commissionAvailableVnd: number;
    depositAvailableVnd: number;
  };
  customers: { newUsers: number; plansSold: number; failedOrders: number };
};

/** Visits and paid web orders, side by side (vande #059). */
export type OverviewAudience = {
  totalVisitors: number;
  devices: { deviceType: OrderDeviceType; visits: number; orders: number }[];
  customers: { kind: 'new' | 'returning'; visits: number; orders: number }[];
  countries: {
    country: string;
    name: string;
    visitors: number;
    percent: number;
    cities: { city: string; visitors: number; percent: number }[];
  }[];
};
