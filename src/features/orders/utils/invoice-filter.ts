/**
 * The "Hóa đơn" filter on the orders list (#051).
 *
 * One select covers both questions admins ask: "which orders asked for a VAT
 * invoice?" and "which of those still need issuing?". The URL keeps the short
 * value; the API gets `hasInvoice` or `invoiceStatus`.
 */

export const INVOICE_FILTER_OPTIONS = [
  { value: 'all', label: 'Hóa đơn: Tất cả' },
  { value: 'requested', label: 'Có yêu cầu xuất hóa đơn' },
  { value: 'none', label: 'Không yêu cầu hóa đơn' },
  { value: 'PENDING', label: 'Hóa đơn chờ xuất' },
  { value: 'ISSUED', label: 'Hóa đơn đã xuất' },
  { value: 'FAILED', label: 'Hóa đơn lỗi' }
] as const;

export type InvoiceFilterValue = (typeof INVOICE_FILTER_OPTIONS)[number]['value'];

export function invoiceFilterToApi(value: string | null | undefined): {
  hasInvoice?: boolean;
  invoiceStatus?: 'PENDING' | 'ISSUED' | 'FAILED';
} {
  switch (value) {
    case 'requested':
      return { hasInvoice: true };
    case 'none':
      return { hasInvoice: false };
    case 'PENDING':
    case 'ISSUED':
    case 'FAILED':
      return { invoiceStatus: value };
    default:
      return {};
  }
}
