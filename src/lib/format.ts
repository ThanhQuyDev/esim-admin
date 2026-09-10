/**
 * esim.vn runs its books on Vietnam time, while the API stores timestamps in
 * UTC and the CMS renders them in both server and browser components. Without
 * pinning the zone, anything formatted on the server came out in the server's
 * zone (UTC on the VPS) — seven hours behind, which is what admins saw as
 * "giờ bị chậm". Every date shown in the CMS goes through the helpers below.
 */
export const VN_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export function formatDate(
  date: Date | string | number | undefined,
  opts: Intl.DateTimeFormatOptions = {}
) {
  if (!date) return '';

  try {
    return new Intl.DateTimeFormat('en-US', {
      month: opts.month ?? 'long',
      day: opts.day ?? 'numeric',
      year: opts.year ?? 'numeric',
      timeZone: opts.timeZone ?? VN_TIME_ZONE,
      ...opts
    }).format(new Date(date));
  } catch {
    return '';
  }
}

/** Date only, Vietnam time — "09/09/2026". */
export function formatDateVn(
  date: Date | string | number | null | undefined,
  opts: Intl.DateTimeFormatOptions = {}
): string {
  if (!date) return '';

  try {
    return new Date(date).toLocaleDateString('vi-VN', {
      timeZone: VN_TIME_ZONE,
      ...opts
    });
  } catch {
    return '';
  }
}

/** Date + time, Vietnam time — "09/09/2026 10:30:00". */
export function formatDateTimeVn(
  date: Date | string | number | null | undefined,
  opts: Intl.DateTimeFormatOptions = {}
): string {
  if (!date) return '';

  try {
    return new Date(date).toLocaleString('vi-VN', {
      timeZone: VN_TIME_ZONE,
      ...opts
    });
  } catch {
    return '';
  }
}

/**
 * Format data size from MB to a human-readable string.
 * >= 1024 MB → display as GB, otherwise display as MB.
 */
export function formatDataSize(mb: number): string {
  if (mb <= 0) return 'Không giới hạn';
  if (mb >= 1024) {
    const gb = mb / 1024;
    return `${Number.isInteger(gb) ? gb : gb.toFixed(2)} GB`;
  }
  return `${mb} MB`;
}

export function formatVnd(value: number | undefined): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(value ?? 0);
}

export function formatNumber(value: number | undefined): string {
  return new Intl.NumberFormat('vi-VN').format(value ?? 0);
}

export function formatPercent(value: number | undefined, maximumFractionDigits = 1): string {
  return `${new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits,
    minimumFractionDigits: 0
  }).format(value ?? 0)}%`;
}

/**
 * Format a 2-letter country code (ISO 3166-1 alpha-2) to "Country Name (CODE)".
 * Falls back to just the code if the locale data is unavailable.
 * @example formatCountry('VN') => 'Việt Nam (VN)'
 */
export function formatCountry(code: string | undefined | null, locale = 'vi'): string {
  if (!code) return '';
  const upper = code.trim().toUpperCase();
  if (upper.length !== 2) return upper;
  try {
    const displayNames = new Intl.DisplayNames([locale], { type: 'region' });
    const name = displayNames.of(upper);
    return name && name !== upper ? `${name} (${upper})` : upper;
  } catch {
    return upper;
  }
}
