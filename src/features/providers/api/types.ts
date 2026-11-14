/** One supplier's on/off state for selling (#005). */
export type ProviderSalesStatus = {
  provider: string;
  isEnabled: boolean;
  disabledReason: string | null;
  disabledAt: string | null;
  /** Plans on sale right now. */
  activePlanCount: number;
  /** Plans this switch took down, i.e. what comes back if it is switched on. */
  disabledPlanCount: number;
  /** "Billion Connect" (vande-1411 #024). */
  displayName: string | null;
  /** "BL", shown on the overview instead of the name. */
  shortCode: string | null;
  /** Sold through an API; can be renamed, never deleted. */
  isApi: boolean;
  /** Added by hand: a domestic supplier imported by file. */
  isManual: boolean;
  /** Every plan it supplies, on sale or not. */
  planCount: number;
  /** Its eSIMs, in stock or sold. */
  esimCount: number;
};

/** "+ Thêm nhà cung cấp": the carrier slug becomes "<slug>-noidia". */
export type CreateProviderPayload = {
  displayName: string;
  provider: string;
  shortCode: string;
};

export type UpdateProviderPayload = {
  displayName?: string;
  shortCode?: string;
};

export type ProviderSalesStatusesResponse = {
  data: ProviderSalesStatus[];
};

export type SetProviderSalesStatusPayload = {
  isEnabled: boolean;
  disabledReason?: string | null;
};
