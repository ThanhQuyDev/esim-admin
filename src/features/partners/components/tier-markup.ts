import { formatVnd } from '@/lib/format';

import type { CostMarkupRange, PartnerTier } from '../api/types';

/** "0 ₫ – 999.999 ₫: +15%" or "…: +50.000 ₫" (doitac-3010 #040). */
export function markupRangeText(range: CostMarkupRange): string {
  const add =
    Number(range.fixedVnd) > 0
      ? `+${formatVnd(Number(range.fixedVnd))}`
      : `+${Number(range.percent)}%`;
  return `${formatVnd(Number(range.fromVnd))} – ${formatVnd(Number(range.toVnd))}: ${add}`;
}

/**
 * A distribution tier's markup in lines: the bands, then the flat % for a
 * cost outside them — or just the flat % for a tier without bands.
 */
export function markupLines(tier: Pick<PartnerTier, 'costMarkupPercent' | 'costMarkupRanges'>) {
  const ranges = tier.costMarkupRanges ?? [];
  const flat = `+${Number(tier.costMarkupPercent ?? 0)}%`;
  if (ranges.length === 0) return [flat];
  return [...ranges.map(markupRangeText), `Ngoài các khoảng: ${flat}`];
}

/**
 * What is wrong with the bands as typed, or null: each "Từ" no higher than its
 * "Đến", and no two bands covering the same cost — the server refuses both.
 */
export function markupRangesError(ranges: CostMarkupRange[]): string | null {
  const sorted = ranges.toSorted((a, b) => a.fromVnd - b.fromVnd);
  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i];
    if (r.fromVnd > r.toVnd) {
      return `Khoảng ${formatVnd(r.fromVnd)} – ${formatVnd(r.toVnd)}: "Từ" phải nhỏ hơn hoặc bằng "Đến".`;
    }
    const prev = sorted[i - 1];
    if (prev && r.fromVnd <= prev.toVnd) {
      return `Khoảng ${formatVnd(r.fromVnd)} – ${formatVnd(r.toVnd)} trùng với khoảng ${formatVnd(prev.fromVnd)} – ${formatVnd(prev.toVnd)}.`;
    }
  }
  return null;
}
