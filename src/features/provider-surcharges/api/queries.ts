import { queryOptions } from '@tanstack/react-query';
import { getProviderSurcharges } from './service';

export const providerSurchargeKeys = {
  all: ['provider-surcharges'] as const,
  list: () => [...providerSurchargeKeys.all, 'list'] as const
};

export const providerSurchargesQueryOptions = () =>
  queryOptions({
    queryKey: providerSurchargeKeys.list(),
    queryFn: () => getProviderSurcharges()
  });
