import { apiClient } from '@/lib/api-client';
import type {
  CreateInvoiceForOrderPayload,
  Invoice,
  Order,
  OrderDetail,
  OrderFilters,
  OrdersResponse,
  OrderRefundResponse,
  RefundOrderRequest,
  ResendEsimEmailResponse,
  SubmitManualOrderPayload
} from './types';

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

export async function refundOrder(
  id: number,
  data: RefundOrderRequest
): Promise<OrderRefundResponse> {
  return apiClient<OrderRefundResponse>(`/orders/${id}/refund`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function resendEsimEmail(orderId: number): Promise<ResendEsimEmailResponse> {
  return apiClient<ResendEsimEmailResponse>(`/admin/orders/${orderId}/resend-esim-email`, {
    method: 'POST'
  });
}

export async function createInvoiceForOrder(
  orderId: number,
  data: CreateInvoiceForOrderPayload
): Promise<Invoice> {
  return apiClient<Invoice>(`/admin/orders/${orderId}/invoices`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function submitManualOrder(data: SubmitManualOrderPayload): Promise<Order> {
  return apiClient<Order>('/admin/orders/submit-manual', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}
