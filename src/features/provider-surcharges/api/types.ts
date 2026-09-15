/** Tax / fee added to a supplier's cost before prices are compared (#049). */
export type ProviderSurcharge = {
  provider: string;
  /** Percent added to the cost; 0 = compared at its listed cost. */
  percentage: number;
  note: string | null;
  updatedAt: string | null;
  /** Active plans the surcharge affects. */
  activePlanCount: number;
};

export type ProviderSurchargesResponse = {
  data: ProviderSurcharge[];
};

export type SaveProviderSurchargePayload = {
  percentage: number;
  note?: string | null;
};
