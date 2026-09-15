/**
 * The surcharge box's text as a percentage (#049).
 *
 * Blank = 0 (no surcharge). A comma is accepted as the decimal mark, since
 * that is how Vietnamese admins write "8,5". Returns null for anything that is
 * not 0–100 with at most two decimals, so the row cannot be saved.
 */
export function parseSurchargePercent(raw: string): number | null {
  const text = raw.trim().replace(',', '.');
  if (text === '') return 0;
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(text)) return null;
  const value = Number(text);
  return value >= 0 && value <= 100 ? value : null;
}

/** Cost after the surcharge, for the example shown next to the input. */
export function surchargedAmount(cost: number, percentage: number): number {
  return cost * (1 + percentage / 100);
}
