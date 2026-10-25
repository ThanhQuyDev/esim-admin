import { downloadFilename } from '@/lib/download-filename';
import { apiClient } from '@/lib/api-client';
import type {
  CreateInvoiceForOrderPayload,
  Invoice,
  InvoiceStatus,
  Order,
  OrderDetail,
  OrderFilters,
  OrdersResponse,
  OrderRefundResponse,
  RefundOrderRequest,
  ResendEsimEmailResponse,
  SubmitManualOrderPayload,
  ManualOrderFilePreview,
  BulkOrderResult
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

/** Reads an order file into plans; places nothing (doitac-1410 #084). */
export async function previewManualOrderFile(file: File): Promise<ManualOrderFilePreview> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/admin/orders/import-file', { method: 'POST', body: formData });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || `Không đọc được file: ${res.status}`);
  return body as ManualOrderFilePreview;
}

/** Where the browser downloads the order file template (doitac-1410 #084). */
export const MANUAL_ORDER_TEMPLATE_URL = '/api/admin/orders/import-template';

/** Reads a bulk file — up to 50 rows, with emails; places nothing (vande #057). */
export async function previewBulkOrderFile(file: File): Promise<ManualOrderFilePreview> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/admin/orders/bulk/import-file', { method: 'POST', body: formData });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || `Không đọc được file: ${res.status}`);
  return body as ManualOrderFilePreview;
}

/** "Đặt eSIM hàng loạt" (vande #057). */
export async function submitBulkOrder(data: {
  mode: 'email' | 'file';
  emailIntervalSec?: number;
  rows: { slug: string; quantity: number; email?: string | null }[];
}): Promise<BulkOrderResult> {
  return apiClient<BulkOrderResult>('/admin/orders/bulk', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/** The bulk file template, with "Email nhận QR" (vande #057). */
export const BULK_ORDER_TEMPLATE_URL = '/api/admin/orders/bulk/import-template';

export async function updateInvoiceStatus(
  invoiceId: string,
  status: 'PENDING' | 'ISSUED' | 'FAILED'
): Promise<Invoice> {
  return apiClient<Invoice>(`/invoices/${invoiceId}`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
}

/**
 * Download the supplier-reconciliation sheet (#028). The file name comes from
 * the backend, which stamps it with the export time in Vietnam time.
 */
export async function exportOrdersExcel(filters: OrderFilters): Promise<void> {
  const params = new URLSearchParams();
  if (filters.filters) params.set('filters', filters.filters);
  if (filters.sort) params.set('sort', filters.sort);

  const query = params.toString();
  const res = await fetch(`/api/orders/export-excel${query ? `?${query}` : ''}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Export failed: ${res.status}`);
  }

  const blob = await res.blob();
  const disposition = res.headers.get('content-disposition');
  const filename =
    disposition?.match(/filename="?([^"]+)"?/)?.[1] || downloadFilename('Doi-soat-don-hang');

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/**
 * Ask the supplier again for the eSIMs an order never received (#030).
 * Lines that already have an eSIM are skipped server-side.
 */
export async function retryOrderProvisioning(
  orderId: number,
  /** Chosen lines; omitted re-orders every eligible line (#014). */
  itemIds?: number[]
): Promise<{
  retriedItemIds: number[];
  skippedItemIds: number[];
  emailsSent: number;
  message: string;
}> {
  return apiClient(`/orders/${orderId}/retry-provisioning`, {
    method: 'POST',
    body: JSON.stringify(itemIds?.length ? { itemIds } : {})
  });
}

/** "Thêm ghi chú" on an order (doitac-1410 #067). */
export async function addOrderNote(orderId: number, body: string): Promise<unknown> {
  return apiClient(`/orders/${orderId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ body })
  });
}
