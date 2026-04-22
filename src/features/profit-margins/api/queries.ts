import { queryOptions } from '@tanstack/react-query';
import { getProfitMargin } from './service';

export const profitMarginKeys = {
  all: ['profit-margins'] as const,
  detail: () => [...profitMarginKeys.all, 'detail'] as const
};

export const profitMarginQueryOptions = () =>
  queryOptions({
    queryKey: profitMarginKeys.detail(),
    queryFn: () => getProfitMargin()
  });
