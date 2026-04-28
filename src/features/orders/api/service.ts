import { apiClient } from '@/lib/api-client';
import type { OrderDetail, OrderFilters, OrdersResponse } from './types';

export async function getOrders(filters: OrderFilters): Promise<OrdersResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.filters) params.set('filters', filters.filters);
  if (filters.sort) params.set('sort', filters.sort);

  const query = params.toString();
  return apiClient<OrdersResponse>(`/orders${query ? `?${query}` : ''}`);
}

export async function getOrder(id: number): Promise<OrderDetail> {
  return apiClient<OrderDetail>(`/orders/${id}`);
}
