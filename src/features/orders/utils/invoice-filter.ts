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

/**
 * Order states with nothing left to invoice (#011).
 *
 * A failed order was never paid and a refunded one has been paid back, so a VAT
 * invoice for either would be a document for money esim.vn does not hold.
 * `cancelled` is included for the same reason — the orders list renders that
 * badge, so the state is reachable.
 */
const NON_INVOICEABLE_STATUSES = new Set(['failed', 'refunded', 'cancelled']);

/**
 * Whether the "Xuất hóa đơn" action should be offered at all.
 *
 * A partially refunded order still has a payable remainder and keeps its
 * `paid` status, so it stays invoiceable — the check is on status alone, never on
 * `refundedAmountVnd`.
 */
export function canIssueInvoice(status: string | null | undefined): boolean {
  return !NON_INVOICEABLE_STATUSES.has((status ?? '').toLowerCase());
}

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
