/**
 * Display metadata for an eSIM status, shared by the table and the detail view
 * so the two can never disagree.
 *
 * "Chưa bán" only makes sense for Viettel / local inventory, which is uploaded
 * before anyone buys it. Every other supplier provisions an eSIM at the moment
 * of purchase, so those rows are `sold` from the start — see
 * `EsimsService.resolveDeliveredStatus` on the backend.
 */
export const ESIM_STATUS_LABELS: Record<string, string> = {
  available: 'Chưa bán',
  sold: 'Đã bán',
  active: 'Đang dùng',
  expired: 'Hết hạn',
  deactivated: 'Đã huỷ kích hoạt',
  refunded: 'Đã hoàn tiền'
};

export const ESIM_STATUS_VARIANTS: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  available: 'outline',
  active: 'default',
  expired: 'destructive',
  deactivated: 'secondary',
  sold: 'default',
  refunded: 'destructive'
};

export function esimStatusLabel(status: string | null | undefined): string {
  if (!status) return '—';
  return ESIM_STATUS_LABELS[status] ?? status;
}

export function esimStatusVariant(
  status: string | null | undefined
): 'default' | 'secondary' | 'destructive' | 'outline' {
  return (status && ESIM_STATUS_VARIANTS[status]) || 'outline';
}

/** Options for the status filter, in the order an admin thinks about them. */
export const ESIM_STATUS_OPTIONS = [
  'available',
  'sold',
  'active',
  'expired',
  'deactivated',
  'refunded'
].map((value) => ({ value, label: ESIM_STATUS_LABELS[value] }));
