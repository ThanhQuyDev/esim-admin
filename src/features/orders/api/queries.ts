import { queryOptions } from '@tanstack/react-query';
import { getOrders, getOrder } from './service';
import type { Order, OrderDetail, OrderFilters } from './types';

export type { Order, OrderDetail };

export const orderKeys = {
  all: ['orders'] as const,
  list: (filters: OrderFilters) => [...orderKeys.all, 'list', filters] as const,
  detail: (id: number) => [...orderKeys.all, 'detail', id] as const
};

export const ordersQueryOptions = (filters: OrderFilters) =>
  queryOptions({
    queryKey: orderKeys.list(filters),
    queryFn: () => getOrders(filters)
  });

export const orderQueryOptions = (id: number) =>
  queryOptions({
    queryKey: orderKeys.detail(id),
    queryFn: () => getOrder(id)
  });
