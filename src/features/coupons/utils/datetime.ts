/**
 * The expiry picker's value, split into a date and a 24-hour time (#039).
 *
 * A native `datetime-local` input renders its time in the browser's locale, so
 * on a Vietnamese machine admins got "SA/CH" (AM/PM) and had to think twice
 * about noon and midnight. The value keeps the same `YYYY-MM-DDTHH:mm` shape;
 * only the controls change.
 *
 * Seconds too since vande-1411 #041: `YYYY-MM-DDTHH:mm:ss`. A value without
 * them (an older draft) still reads.
 */

export const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
export const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
export const SECONDS = MINUTES;

/** An expiry picked without a time runs to the end of that day. */
export const DEFAULT_HOUR = '23';
export const DEFAULT_MINUTE = '59';
export const DEFAULT_SECOND = '59';

export interface DateTimeParts {
  date: string;
  hour: string;
  minute: string;
  second: string;
}

export function splitDateTime(value: string | null | undefined): DateTimeParts {
  const match = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(value ?? '');
  if (!match) {
    return { date: '', hour: DEFAULT_HOUR, minute: DEFAULT_MINUTE, second: DEFAULT_SECOND };
  }
  return {
    date: match[1],
    hour: match[2] ?? DEFAULT_HOUR,
    minute: match[3] ?? DEFAULT_MINUTE,
    // "HH:mm" alone meant the start of that minute.
    second: match[4] ?? (match[2] ? '00' : DEFAULT_SECOND)
  };
}

/** Back to `YYYY-MM-DDTHH:mm:ss`; empty until a date is chosen, so "required" still holds. */
export function joinDateTime({ date, hour, minute, second }: DateTimeParts): string {
  if (!date) return '';
  const hh = HOURS.includes(hour) ? hour : DEFAULT_HOUR;
  const mm = MINUTES.includes(minute) ? minute : DEFAULT_MINUTE;
  const ss = SECONDS.includes(second) ? second : DEFAULT_SECOND;
  return `${date}T${hh}:${mm}:${ss}`;
}

/** A stored moment as the picker's value, in the browser's own clock. */
export function toPickerValue(moment: string | Date | null | undefined): string {
  if (!moment) return '';
  const d = new Date(moment);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
