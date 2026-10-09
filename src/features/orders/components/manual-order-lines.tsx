'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import { destinationsQueryOptions } from '@/features/destinations/api/queries';
import { regionsQueryOptions } from '@/features/regions/api/queries';
import { locationKeywords, locationLabel } from '@/features/plans/utils/location-options';
import { PlanPicker, type PickedPlan } from './plan-picker';

/**
 * The plans of an order placed on a customer's behalf (#031, test round 4):
 * one row per kind of eSIM, each with its own filters — country / region,
 * days, data, plan type, topup, plan code — so the right plan can be found
 * among thousands ("vietnam" alone matched mostly domestic eSIMs), and its own
 * quantity. "+" adds a row; the order takes them all at once.
 */
export type ManualOrderLine = {
  key: number;
  location: string; // 'd:<id>' | 'r:<id>' | ''
  duration: string;
  data: string;
  type: string;
  topUp: string; // '' | 'true' | 'false'
  planCode: string;
  plan: PickedPlan | null;
  quantity: string;
};

let nextKey = 1;
export function emptyManualOrderLine(): ManualOrderLine {
  return {
    key: nextKey++,
    location: '',
    duration: '',
    data: '',
    type: '',
    topUp: '',
    planCode: '',
    plan: null,
    quantity: '1'
  };
}

const TYPE_OPTIONS = [
  { value: 'fixed', label: 'Gói cố định' },
  { value: 'daily', label: 'Gói theo ngày' },
  { value: 'unlimited', label: 'Không giới hạn' },
  { value: 'unlimited-reduce', label: 'Không giới hạn tốc độ thường' }
];
const ANY = '__any';

function lineFilters(line: ManualOrderLine): Record<string, unknown> {
  const filters: Record<string, unknown> = {};
  const [kind, rawId] = line.location.split(':');
  const id = Number(rawId);
  if (id > 0) filters[kind === 'r' ? 'regionId' : 'destinationId'] = id;
  const days = Number(line.duration);
  if (days > 0) filters.duration = days;
  if (line.data.trim()) filters.data = line.data.trim();
  if (line.type) filters.type = line.type;
  if (line.topUp) filters.topUp = line.topUp === 'true';
  if (line.planCode.trim()) filters.planCode = line.planCode.trim();
  return filters;
}

function LocationPicker({
  value,
  onChange,
  testId
}: {
  value: string;
  onChange: (value: string) => void;
  testId: string;
}) {
  const [open, setOpen] = useState(false);
  const { data: destinations } = useQuery(destinationsQueryOptions({ page: 1, limit: 500 }));
  const { data: regions } = useQuery(regionsQueryOptions({ page: 1, limit: 500 }));
  const options = useMemo(
    () => [
      ...(destinations?.data ?? []).map((d) => ({
        value: `d:${d.id}`,
        label: locationLabel(d),
        keywords: locationKeywords(d)
      })),
      ...(regions?.data ?? []).map((r) => ({
        value: `r:${r.id}`,
        label: `Khu vực: ${locationLabel(r)}`,
        keywords: locationKeywords(r)
      }))
    ],
    [destinations, regions]
  );
  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          className='w-full justify-between font-normal'
          data-testid={testId}
          title={selected?.label}
        >
          <span className={selected ? 'truncate' : 'text-muted-foreground truncate'}>
            {selected?.label ?? 'Quốc gia / khu vực'}
          </span>
          <Icons.chevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[22rem] p-0' align='start'>
        <Command>
          <CommandInput placeholder='Gõ tên, VD: trung quoc, viet nam...' />
          <CommandList>
            <CommandEmpty>Không tìm thấy.</CommandEmpty>
            <CommandGroup>
              {value && (
                <CommandItem
                  value='__clear'
                  onSelect={() => {
                    onChange('');
                    setOpen(false);
                  }}
                >
                  — Bỏ chọn —
                </CommandItem>
              )}
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.value}`}
                  keywords={option.keywords}
                  title={option.label}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <span className='truncate'>{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function ManualOrderLines({
  lines,
  onChange,
  showErrors
}: {
  lines: ManualOrderLine[];
  onChange: (lines: ManualOrderLine[]) => void;
  showErrors: boolean;
}) {
  const update = (key: number, patch: Partial<ManualOrderLine>) =>
    onChange(
      lines.map((line) => {
        if (line.key !== key) return line;
        const next = { ...line, ...patch };
        // A filter change can rule the picked plan out — make them pick again.
        if (!('plan' in patch) && !('quantity' in patch)) next.plan = null;
        return next;
      })
    );

  return (
    <div className='space-y-3' data-testid='manual-order-lines'>
      {lines.map((line, index) => (
        <div
          key={line.key}
          className='space-y-3 rounded-lg border p-3'
          data-testid={`manual-line-${index}`}
        >
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium'>Gói eSIM #{index + 1}</span>
            {lines.length > 1 && (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => onChange(lines.filter((l) => l.key !== line.key))}
                aria-label={`Xoá dòng ${index + 1}`}
              >
                <Icons.close className='h-4 w-4' />
              </Button>
            )}
          </div>
          <div className='grid grid-cols-1 gap-2 md:grid-cols-3'>
            <LocationPicker
              value={line.location}
              onChange={(location) => update(line.key, { location })}
              testId={`manual-line-${index}-location`}
            />
            <Input
              type='number'
              min={1}
              placeholder='Số ngày'
              value={line.duration}
              onChange={(e) => update(line.key, { duration: e.target.value })}
              aria-label='Số ngày'
            />
            <Input
              placeholder='Data, VD: 1GB, 500MB'
              value={line.data}
              onChange={(e) => update(line.key, { data: e.target.value })}
              aria-label='Data'
            />
            <Select
              value={line.type || ANY}
              onValueChange={(v) => update(line.key, { type: v === ANY ? '' : v })}
            >
              <SelectTrigger aria-label='Loại gói'>
                <SelectValue placeholder='Loại gói' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Mọi loại gói</SelectItem>
                {TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={line.topUp || ANY}
              onValueChange={(v) => update(line.key, { topUp: v === ANY ? '' : v })}
            >
              <SelectTrigger aria-label='Hỗ trợ topup'>
                <SelectValue placeholder='Hỗ trợ topup' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Topup: tất cả</SelectItem>
                <SelectItem value='true'>Có topup</SelectItem>
                <SelectItem value='false'>Không topup</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder='Mã gói / slug'
              value={line.planCode}
              onChange={(e) => update(line.key, { planCode: e.target.value })}
              aria-label='Mã gói'
            />
          </div>
          <div className='grid grid-cols-1 gap-2 md:grid-cols-[1fr_120px]'>
            <PlanPicker
              value={line.plan}
              onChange={(plan) => update(line.key, { plan })}
              filters={lineFilters(line)}
              label='Chọn gói (đã lọc theo điều kiện trên)'
              required
              testId={`manual-line-${index}-plan`}
            />
            <div className='space-y-2'>
              <label className='text-sm font-medium'>
                Số lượng<span className='text-destructive ml-1'>*</span>
              </label>
              <Input
                type='number'
                min={1}
                value={line.quantity}
                onChange={(e) => update(line.key, { quantity: e.target.value })}
                aria-label={`Số lượng dòng ${index + 1}`}
              />
            </div>
          </div>
          {showErrors && !line.plan && (
            <p className='text-destructive text-xs'>Hãy chọn một gói eSIM cho dòng này.</p>
          )}
          {showErrors && !(Number(line.quantity) >= 1) && (
            <p className='text-destructive text-xs'>Số lượng phải từ 1 trở lên.</p>
          )}
        </div>
      ))}
      <Button
        type='button'
        variant='outline'
        onClick={() => onChange([...lines, emptyManualOrderLine()])}
        data-testid='manual-line-add'
      >
        <Icons.add className='mr-2 h-4 w-4' />
        Thêm loại eSIM
      </Button>
    </div>
  );
}
