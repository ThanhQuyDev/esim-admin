/**
 * What can be bought on top of a plan (vande-0411 #015). Add-on adds data and
 * keeps the validity; top-up extends the validity.
 */
export type PlanPurchaseKind = 'topup' | 'addon' | 'none';

export const PURCHASE_KIND_LABEL: Record<PlanPurchaseKind, string> = {
  topup: 'Topup',
  addon: 'Addon',
  none: 'Không'
};

/** The server's reading, or what an older answer's flags say. */
export function purchaseKindOf(
  plan:
    | { purchaseKind?: PlanPurchaseKind | null; topUp?: boolean | null; isAddOn?: boolean | null }
    | null
    | undefined
): PlanPurchaseKind {
  if (plan?.purchaseKind) return plan.purchaseKind;
  if (plan?.isAddOn) return 'addon';
  return plan?.topUp ? 'topup' : 'none';
}

export function purchaseKindLabel(plan: Parameters<typeof purchaseKindOf>[0]): string {
  return PURCHASE_KIND_LABEL[purchaseKindOf(plan)];
}
