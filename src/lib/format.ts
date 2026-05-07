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
      ...opts
    }).format(new Date(date));
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
