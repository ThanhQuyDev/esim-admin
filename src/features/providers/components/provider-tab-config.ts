// Single source of truth for the "Nhà cung cấp" page tabs (#005): one menu entry
// holds every supplier-related screen instead of scattering them down the sidebar.

// "Danh sách Nhà cung cấp" comes first (vande-1411 #024).
export const PROVIDER_TAB_VALUES = ['list', 'surcharges', 'deposits', 'sales-status'] as const;
export type ProviderTab = (typeof PROVIDER_TAB_VALUES)[number];

export const PROVIDER_TAB_DEFAULT: ProviderTab = 'list';

export const PROVIDER_TAB_LABELS: Record<ProviderTab, string> = {
  list: 'Danh sách Nhà cung cấp',
  surcharges: 'Thuế phí',
  deposits: 'Ký quỹ',
  'sales-status': 'Bật/tắt bán'
};
