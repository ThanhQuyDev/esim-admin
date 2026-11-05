'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import { HOURS, MINUTES, joinDateTime, splitDateTime } from '../utils/datetime';

/**
 * A date with 24-hour hour and minute pickers (#039), shared by the admin's
 * coupon form and the partner's "Tạo mã giảm giá" (doitac-3010 #016). The
 * value is `YYYY-MM-DDTHH:mm`, empty until a date is chosen.
 */
export function DateTimeField({
  label,
  value,
  onChange,
  required,
  id = 'coupon-expiry-date'
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  id?: string;
}) {
  // A date plus 24-hour hour/minute pickers instead of `datetime-local`, whose
  // time follows the browser locale and showed "SA/CH" to admins (#039).
  const parts = splitDateTime(value);
  const update = (patch: Partial<typeof parts>) => onChange(joinDateTime({ ...parts, ...patch }));

  return (
    <div className='space-y-2'>
      <label htmlFor={id} className='text-sm font-medium'>
        {label}
        {required && <span className='text-destructive'> *</span>}
      </label>
      {/* In a narrow box the time drops below the date, hour and minute together. */}
      <div className='flex flex-wrap items-center gap-2'>
        <Input
          id={id}
          type='date'
          className='min-w-0 flex-1 sm:w-[145px] sm:flex-none'
          value={parts.date}
          onChange={(e) => update({ date: e.target.value })}
        />
        <div className='flex items-center gap-2'>
          <Select value={parts.hour} onValueChange={(hour) => update({ hour })}>
            <SelectTrigger
              className='w-[72px]'
              aria-label='Giờ (24h)'
              data-testid='coupon-expiry-hour'
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='max-h-64'>
              {HOURS.map((h) => (
                <SelectItem key={h} value={h}>
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className='text-muted-foreground'>:</span>
          <Select value={parts.minute} onValueChange={(minute) => update({ minute })}>
            <SelectTrigger
              className='w-[72px]'
              aria-label='Phút'
              data-testid='coupon-expiry-minute'
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='max-h-64'>
              {MINUTES.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className='text-muted-foreground text-xs'>Giờ theo định dạng 24h (00:00 – 23:59).</p>
    </div>
  );
}
