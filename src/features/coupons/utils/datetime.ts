/**
 * The expiry picker's value, split into a date and a 24-hour time (#039).
 *
 * A native `datetime-local` input renders its time in the browser's locale, so
 * on a Vietnamese machine admins got "SA/CH" (AM/PM) and had to think twice
 * about noon and midnight. The value keeps the same `YYYY-MM-DDTHH:mm` shape;
 * only the controls change.
 */

export const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
export const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

/** An expiry picked without a time runs to the end of that day. */
export const DEFAULT_HOUR = '23';
export const DEFAULT_MINUTE = '59';

export interface DateTimeParts {
  date: string;
  hour: string;
  minute: string;
}

export function splitDateTime(value: string | null | undefined): DateTimeParts {
  const match = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}):(\d{2}))?/.exec(value ?? '');
  if (!match) return { date: '', hour: DEFAULT_HOUR, minute: DEFAULT_MINUTE };
  return {
    date: match[1],
    hour: match[2] ?? DEFAULT_HOUR,
    minute: match[3] ?? DEFAULT_MINUTE
  };
}

/** Back to `YYYY-MM-DDTHH:mm`; empty until a date is chosen, so "required" still holds. */
export function joinDateTime({ date, hour, minute }: DateTimeParts): string {
  if (!date) return '';
  const hh = HOURS.includes(hour) ? hour : DEFAULT_HOUR;
  const mm = MINUTES.includes(minute) ? minute : DEFAULT_MINUTE;
  return `${date}T${hh}:${mm}`;
}
