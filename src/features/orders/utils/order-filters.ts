import { invoiceFilterToApi } from './invoice-filter';

/**
 * URL params → the `filters` object the orders API takes.
 *
 * One implementation, used by both the server component that prefetches the
 * query and the client component that reads it back. They are compared as
 * `JSON.stringify(filters)` inside the query key, so even the KEY ORDER has to
 * match — build them in two places and the prefetch is silently thrown away on
 * every page load. The server copy had already fallen behind by four filters.
 */
export type OrderFilterParams = {
  orderNumber?: string | null;
  userEmail?: string | null;
  iccid?: string | null;
  planName?: string | null;
  status?: string | null;
  invoice?: string | null;
  /** esim | affiliate | topup (#017). */
  kind?: string | null;
  createdFrom?: string | null;
  createdTo?: string | null;
};

/**
 * Status the list opens on (#017): an admin arriving here is looking at real
 * sales, not abandoned checkouts. `all` is the explicit "no filter" choice.
 */
export const DEFAULT_ORDER_STATUS = 'paid';

export function buildOrderApiFilters(params: OrderFilterParams): Record<string, unknown> {
  const filters: Record<string, unknown> = {};

  if (params.orderNumber) filters.orderNumber = params.orderNumber;
  if (params.userEmail) filters.userEmail = params.userEmail;
  if (params.iccid) filters.iccid = params.iccid;
  if (params.planName) filters.planName = params.planName;

  const status = params.status ?? DEFAULT_ORDER_STATUS;
  if (status && status !== 'all') filters.status = status;

  // VAT invoice request / status (#051).
  Object.assign(filters, invoiceFilterToApi(params.invoice));

  if (params.kind && params.kind !== 'all') filters.kind = params.kind;
  if (params.createdFrom) filters.createdFrom = params.createdFrom;
  if (params.createdTo) filters.createdTo = params.createdTo;

  return filters;
}
