'use client';

/**
 * The price list's filters (doitac-1410 #033) — the admin plan list's own:
 * destination (country/region), plan name, days, data, plan type, top-up,
 * calls/SMS, TikTok & AI and cheapest. "Hoạt động" is left out: a partner only
 * ever sees plans they can buy now.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

import { catalogueLocationsQueryOptions } from '../api/queries';
import type { CatalogueFilters } from '../api/types';

const YES_NO = [
  { value: 'all', label: 'Tất cả' },
  { value: 'true', label: 'Có' },
  { value: 'false', label: 'Không' }
];

const PLAN_TYPES = [
  { value: 'all', label: 'Tất cả loại gói' },
  { value: 'fixed', label: 'Cố định' },
  { value: 'daily', label: 'Theo ngày' },
  { value: 'unlimited', label: 'Không giới hạn' },
  { value: 'unlimited-reduce', label: 'Không giới hạn giảm tốc' }
];

export const EMPTY_CATALOGUE_FILTERS: CatalogueFilters = {};

function LocationPicker({
  value,
  onChange
}: {
  value?: string;
  onChange: (value: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const { data: options = [] } = useQuery(catalogueLocationsQueryOptions());
  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='w-full justify-between font-normal'
          data-testid='catalogue-location'
        >
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>
            {selected?.label ?? 'Tất cả điểm đến'}
          </span>
          <Icons.chevronDown className='size-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[--radix-popover-trigger-width] min-w-[240px] p-0' align='start'>
        <Command>
          <CommandInput placeholder='Tìm quốc gia / khu vực…' />
          <CommandList>
            <CommandEmpty>Không có điểm đến này.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value='Tất cả điểm đến'
                onSelect={() => {
                  onChange(undefined);
                  setOpen(false);
                }}
              >
                Tất cả điểm đến
              </CommandItem>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  {option.label}
                  {option.value === value && <Icons.check className='ml-auto size-4' />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function YesNoSelect({
  label,
  value,
  onChange,
  testId
}: {
  label: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  testId: string;
}) {
  return (
    <Select value={value ?? 'all'} onValueChange={(v) => onChange(v === 'all' ? undefined : v)}>
      <SelectTrigger className='w-full' aria-label={label} data-testid={testId}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {YES_NO.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.value === 'all' ? `${label}: tất cả` : `${label}: ${o.label}`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function PortalCatalogueFilters({
  value,
  onChange
}: {
  value: CatalogueFilters;
  onChange: (value: CatalogueFilters) => void;
}) {
  const set = (patch: Partial<CatalogueFilters>) => onChange({ ...value, ...patch });
  const active = Object.values(value).some((v) => v !== undefined && v !== '');

  return (
    <div className='space-y-3' data-testid='catalogue-filters'>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <LocationPicker value={value.location} onChange={(location) => set({ location })} />
        <Input
          placeholder='Tên gói eSIM'
          value={value.search ?? ''}
          onChange={(e) => set({ search: e.target.value || undefined })}
          data-testid='catalogue-search'
        />
        <Input
          type='number'
          inputMode='numeric'
          min={1}
          placeholder='Số ngày dùng'
          value={value.duration ?? ''}
          onChange={(e) => set({ duration: e.target.value || undefined })}
          data-testid='catalogue-duration'
        />
        <Input
          placeholder='Dung lượng, vd 5GB, 500MB'
          value={value.data ?? ''}
          onChange={(e) => set({ data: e.target.value || undefined })}
          data-testid='catalogue-data'
        />
      </div>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5'>
        <Select
          value={value.type ?? 'all'}
          onValueChange={(v) => set({ type: v === 'all' ? undefined : v })}
        >
          <SelectTrigger className='w-full' aria-label='Loại gói' data-testid='catalogue-type'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PLAN_TYPES.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <YesNoSelect
          label='Topup'
          value={value.topUp}
          onChange={(topUp) => set({ topUp })}
          testId='catalogue-topup'
        />
        <YesNoSelect
          label='Gọi/SMS'
          value={value.hasCallSms}
          onChange={(hasCallSms) => set({ hasCallSms })}
          testId='catalogue-callsms'
        />
        <YesNoSelect
          label='Tiktok & AI'
          value={value.tiktokAi}
          onChange={(tiktokAi) => set({ tiktokAi })}
          testId='catalogue-tiktok'
        />
        <YesNoSelect
          label='Rẻ nhất'
          value={value.isCheapest}
          onChange={(isCheapest) => set({ isCheapest })}
          testId='catalogue-cheapest'
        />
      </div>
      {active && (
        <Button variant='ghost' size='sm' onClick={() => onChange(EMPTY_CATALOGUE_FILTERS)}>
          Xoá bộ lọc
        </Button>
      )}
    </div>
  );
}
