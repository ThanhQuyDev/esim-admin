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
};

export type ProviderSalesStatusesResponse = {
  data: ProviderSalesStatus[];
};

export type SetProviderSalesStatusPayload = {
  isEnabled: boolean;
  disabledReason?: string | null;
};
