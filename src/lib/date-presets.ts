/**
 * The quick time presets every page offers (vande #085, doitac-3010 #031),
 * worked out in the browser's own days — "Hôm nay" in Hanoi is not "today" in
 * UTC — as `yyyy-MM-dd` bounds, both days included.
 */

export type DatePreset =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'lastWeek'
  | 'lastMonth';

export const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'yesterday', label: 'Hôm qua' },
  { value: 'last7days', label: '7 ngày qua' },
  { value: 'last30days', label: '30 ngày qua' },
  { value: 'lastWeek', label: 'Tuần trước' },
  { value: 'lastMonth', label: 'Tháng trước' }
];

export const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function resolveDatePreset(
  preset: DatePreset,
  now: Date = new Date()
): { from: string; to: string } {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(today);
  switch (preset) {
    case 'today':
      return { from: isoDay(today), to: isoDay(today) };
    case 'yesterday':
      start.setDate(today.getDate() - 1);
      return { from: isoDay(start), to: isoDay(start) };
    case 'last7days':
      start.setDate(today.getDate() - 6);
      return { from: isoDay(start), to: isoDay(today) };
    case 'lastWeek': {
      // Monday to Sunday of the week before this one.
      const sinceMonday = (today.getDay() + 6) % 7;
      start.setDate(today.getDate() - sinceMonday - 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { from: isoDay(start), to: isoDay(end) };
    }
    case 'lastMonth': {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: isoDay(first), to: isoDay(last) };
    }
    default:
      start.setDate(today.getDate() - 29);
      return { from: isoDay(start), to: isoDay(today) };
  }
}

/** The preset a range is exactly, so the button can name it. */
export function presetOfRange(from?: string, to?: string, now?: Date): DatePreset | null {
  if (!from || !to) return null;
  for (const { value } of DATE_PRESETS) {
    const range = resolveDatePreset(value, now);
    if (range.from === from && range.to === to) return value;
  }
  return null;
}
