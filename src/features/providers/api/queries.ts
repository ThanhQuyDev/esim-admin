import { queryOptions } from '@tanstack/react-query';
import { getProviderSalesStatuses } from './service';

export const providerKeys = {
  all: ['providers'] as const,
  salesStatuses: () => [...providerKeys.all, 'sales-statuses'] as const
};

export const providerSalesStatusesQueryOptions = () =>
  queryOptions({
    queryKey: providerKeys.salesStatuses(),
    queryFn: () => getProviderSalesStatuses()
  });
