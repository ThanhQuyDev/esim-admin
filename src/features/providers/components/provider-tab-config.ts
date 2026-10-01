// Single source of truth for the "Nhà cung cấp" page tabs (#005): one menu entry
// holds every supplier-related screen instead of scattering them down the sidebar.

export const PROVIDER_TAB_VALUES = ['surcharges', 'deposits', 'sales-status'] as const;
export type ProviderTab = (typeof PROVIDER_TAB_VALUES)[number];

export const PROVIDER_TAB_DEFAULT: ProviderTab = 'surcharges';

export const PROVIDER_TAB_LABELS: Record<ProviderTab, string> = {
  surcharges: 'Thuế phí',
  deposits: 'Ký quỹ',
  'sales-status': 'Bật/tắt bán'
};
