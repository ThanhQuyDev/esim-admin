/**
 * A plan's prices in dollars, whatever currency the supplier quotes (vande #005).
 *
 * Viettel and domestic plans are priced in đồng, and the plan list printed
 * those đồng with a dollar sign — "Giá gốc: $198000.0000". The backend already
 * keeps the dollar figures (`usdPrice`, `usdCostPrice`, `usdRetailPrice`); a
 * USD plan's own prices are the fallback for rows synced before those existed.
 */
type PricedPlan = {
  currency?: string | null;
  price?: number | string | null;
  costPrice?: number | string | null;
  retailPrice?: number | string | null;
  usdPrice?: number | string | null;
  usdCostPrice?: number | string | null;
  usdRetailPrice?: number | string | null;
};

function num(value: number | string | null | undefined): number | null {
  const n = Number(value);
  return value === null || value === undefined || value === '' || !Number.isFinite(n) ? null : n;
}

export function planUsd(plan: PricedPlan): {
  price: number | null;
  cost: number | null;
  retail: number | null;
} {
  const isUsd = (plan.currency ?? 'USD').toUpperCase() === 'USD';
  const pick = (usd: PricedPlan['usdPrice'], own: PricedPlan['price']) => {
    const u = num(usd);
    if (u !== null && u > 0) return u;
    return isUsd ? num(own) : null;
  };
  return {
    price: pick(plan.usdPrice, plan.price),
    cost: pick(plan.usdCostPrice, plan.costPrice),
    retail: pick(plan.usdRetailPrice, plan.retailPrice)
  };
}

/** "$7.6536" — `digits` decimals, "—" when unknown. */
export function formatUsd(value: number | null, digits = 2): string {
  return value === null ? '—' : `$${value.toFixed(digits)}`;
}
