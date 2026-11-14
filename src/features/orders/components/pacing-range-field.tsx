'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDateTimeVn } from '@/lib/format';

/**
 * "Khoảng giây giữa các lần gọi API lấy eSIM" (vande-1411 #003): each eSIM
 * is asked for on its own, a random number of seconds in this range after the
 * one before, and — when mailed — emailed as soon as it comes. Used by
 * "Đặt eSIM hàng loạt", "Đặt đơn hộ" from the second kind of eSIM on, and the
 * partner's bulk upload.
 */

export type PacingText = { min: string; max: string };

export const PACING_EMAIL_DEFAULT = { min: 10, max: 30 };
export const PACING_FILE_DEFAULT = { min: 5, max: 10 };

const clamp = (v: number) => Math.min(600, Math.max(0, Math.round(v)));

/** What is sent: empty fields are left to the server's default. */
export function pacingPayload(text: PacingText): { pacingMinSec?: number; pacingMaxSec?: number } {
  const min = text.min.trim() === '' ? null : clamp(Number(text.min));
  const max = text.max.trim() === '' ? null : clamp(Number(text.max));
  return {
    ...(min != null && Number.isFinite(min) ? { pacingMinSec: min } : {}),
    ...(max != null && Number.isFinite(max) ? { pacingMaxSec: max } : {})
  };
}

/** The range the server will use, for the estimate on screen. */
export function effectivePacing(
  text: PacingText,
  fallback: { min: number; max: number }
): { min: number; max: number } {
  const p = pacingPayload(text);
  const a = p.pacingMinSec ?? p.pacingMaxSec;
  const b = p.pacingMaxSec ?? p.pacingMinSec;
  if (a == null || b == null) return fallback;
  return { min: Math.min(a, b), max: Math.max(a, b) };
}

/** "12 phút 30 giây". */
export function durationText(seconds: number): string {
  if (seconds < 60) return `${seconds} giây`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s ? `${m} phút ${s} giây` : `${m} phút`;
}

/** "Dự kiến lấy xong eSIM lúc …" after an order is placed. */
export function provisionEtaText(eta: string | null | undefined): string | null {
  if (!eta) return null;
  const left = Math.max(0, Math.round((new Date(eta).getTime() - Date.now()) / 1000));
  return `Hệ thống lấy lần lượt từng eSIM, dự kiến lấy xong lúc ${formatDateTimeVn(eta)} (khoảng ${durationText(left)} nữa).`;
}

export function PacingRangeField({
  id,
  value,
  onChange,
  fallback,
  esimCount,
  label = 'Khoảng giây giữa các lần lấy eSIM',
  emails
}: {
  id: string;
  value: PacingText;
  onChange: (next: PacingText) => void;
  fallback: { min: number; max: number };
  /** eSIMs of the order, for "xong trong khoảng …". */
  esimCount: number;
  label?: string;
  /** Each eSIM is mailed as it comes: the gap is the email gap too. */
  emails: boolean;
}) {
  const range = effectivePacing(value, fallback);
  const gaps = Math.max(0, esimCount - 1);
  return (
    <div className='space-y-1' data-testid={`${id}-field`}>
      <Label htmlFor={`${id}-min`}>{label}</Label>
      <div className='flex items-center gap-2'>
        <Input
          id={`${id}-min`}
          type='number'
          min={0}
          max={600}
          className='w-24'
          placeholder={String(fallback.min)}
          value={value.min}
          onChange={(e) => onChange({ ...value, min: e.target.value })}
          data-testid={`${id}-min`}
          aria-label='Từ (giây)'
        />
        <span className='text-muted-foreground text-sm'>đến</span>
        <Input
          id={`${id}-max`}
          type='number'
          min={0}
          max={600}
          className='w-24'
          placeholder={String(fallback.max)}
          value={value.max}
          onChange={(e) => onChange({ ...value, max: e.target.value })}
          data-testid={`${id}-max`}
          aria-label='Đến (giây)'
        />
        <span className='text-muted-foreground text-sm'>giây</span>
      </div>
      <p className='text-muted-foreground text-xs'>
        Mỗi eSIM được gọi API riêng, cách eSIM trước một số giây ngẫu nhiên trong khoảng này
        {emails ? ' và gửi email ngay khi lấy được' : ''}. Để trống thì mặc định {fallback.min}–
        {fallback.max} giây.
        {gaps > 0 &&
          ` ${esimCount} eSIM sẽ lấy xong trong khoảng ${durationText(gaps * range.min)}–${durationText(gaps * range.max)}.`}
      </p>
    </div>
  );
}
