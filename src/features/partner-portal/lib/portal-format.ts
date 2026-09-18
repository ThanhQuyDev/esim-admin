/**
 * Number shapes the v29 mockup uses that the shared formatters do not cover:
 * the compact "245,6tr" stat values and the "8.120.000đ" hero amount, which
 * ends in a bare đ rather than the ₫ symbol `formatVnd` produces.
 */

/** "8.120.000đ" — the hero and table amount format used throughout v29. */
export function formatDong(value: number | undefined | null): string {
  return `${Number(value ?? 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}đ`;
}

/**
 * Compact money for `.stat-value`: "245,6tr" over a million, "820ng" over a
 * thousand, plain digits below that.
 */
export function formatCompactDong(value: number | undefined | null): string {
  const v = Number(value ?? 0);
  if (Math.abs(v) >= 1_000_000) {
    return `${(v / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}tr`;
  }
  if (Math.abs(v) >= 1_000) {
    return `${(v / 1_000).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}ng`;
  }
  return v.toLocaleString('vi-VN');
}

/** Millions as a plain number, for chart series plotted in "triệu đồng". */
export function toMillions(value: number | undefined | null): number {
  return Math.round((Number(value ?? 0) / 1_000_000) * 100) / 100;
}

/** "10,1%" */
export function formatPercentVn(value: number, maximumFractionDigits = 1): string {
  return `${Number(value).toLocaleString('vi-VN', { maximumFractionDigits })}%`;
}

/** Thousand-separated integer, as `.stat-value` shows counts ("12.456"). */
export function formatCount(value: number | undefined | null): string {
  return Number(value ?? 0).toLocaleString('vi-VN');
}
