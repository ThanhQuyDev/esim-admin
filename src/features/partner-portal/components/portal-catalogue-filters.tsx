'use client';

/**
 * The price list's filters (doitac-1410 #033) — the admin plan list's own:
 * destination (country/region), plan name, days, data, plan type, top-up,
 * calls/SMS, TikTok & AI and cheapest. "Hoạt động" is left out: a partner only
 * ever sees plans they can buy now.
 *
 * Compact (doitac-3010 #025): every control is as wide as what it shows, all
 * on as few lines as fit, with "Xoá bộ lọc" beside them rather than on a line
 * of its own.
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
  { value: 'all', label: 'Loại gói: tất cả' },
  { value: 'fixed', label: 'Cố định' },
  { value: 'daily', label: 'Theo ngày' },
  { value: 'unlimited', label: 'Không giới hạn' },
  { value: 'unlimited-reduce', label: 'Không giới hạn giảm tốc' }
];

export const EMPTY_CATALOGUE_FILTERS: CatalogueFilters = {};

/**
 * "Điểm đến" like the admin's country / region picker (doitac-3010 #025): the
 * Vietnamese name with the English one beside it, searchable in either, and a
 * button to clear it — but one destination at a time, so the list stays light.
 */
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
          className='h-9 max-w-[18rem] min-w-[11rem] justify-between gap-2 font-normal'
          data-testid='catalogue-location'
        >
          <Icons.global className='size-4 shrink-0 opacity-60' />
          <span className={cn('flex-1 truncate text-left', !selected && 'text-muted-foreground')}>
            {selected?.label ?? 'Điểm đến'}
          </span>
          {selected ? (
            <span
              role='button'
              tabIndex={0}
              aria-label='Xoá điểm đến'
              data-testid='catalogue-location-clear'
              className='opacity-60 hover:opacity-100'
              onClick={(e) => {
                e.stopPropagation();
                onChange(undefined);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(undefined);
                }
              }}
            >
              <Icons.xCircle className='size-4' />
            </span>
          ) : (
            <Icons.chevronDown className='size-4 shrink-0 opacity-50' />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[20rem] p-0' align='start'>
        <Command>
          <CommandInput placeholder='Tìm quốc gia / khu vực (Việt hoặc Anh)…' />
          <CommandList>
            <CommandEmpty>Không có điểm đến này.</CommandEmpty>
            <CommandGroup className='max-h-[18.75rem] overflow-y-auto'>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.value}`}
                  keywords={option.keywords}
                  title={option.label}
                  onSelect={() => {
                    onChange(option.value === value ? undefined : option.value);
                    setOpen(false);
                  }}
                >
                  <span className='truncate'>{option.label}</span>
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
      <SelectTrigger className='h-9 w-auto gap-2' aria-label={label} data-testid={testId}>
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
    <div className='flex flex-wrap items-center gap-2' data-testid='catalogue-filters'>
      <LocationPicker value={value.location} onChange={(location) => set({ location })} />
      <Input
        placeholder='Tên gói eSIM'
        className='h-9 w-48'
        value={value.search ?? ''}
        onChange={(e) => set({ search: e.target.value || undefined })}
        data-testid='catalogue-search'
      />
      <Input
        type='number'
        inputMode='numeric'
        min={1}
        placeholder='Số ngày'
        className='h-9 w-24'
        value={value.duration ?? ''}
        onChange={(e) => set({ duration: e.target.value || undefined })}
        data-testid='catalogue-duration'
      />
      <Input
        placeholder='Data, vd 5GB'
        className='h-9 w-32'
        value={value.data ?? ''}
        onChange={(e) => set({ data: e.target.value || undefined })}
        data-testid='catalogue-data'
      />
      <Select
        value={value.type ?? 'all'}
        onValueChange={(v) => set({ type: v === 'all' ? undefined : v })}
      >
        <SelectTrigger
          className='h-9 w-auto gap-2'
          aria-label='Loại gói'
          data-testid='catalogue-type'
        >
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
      {active && (
        <Button
          variant='ghost'
          size='sm'
          className='h-9'
          onClick={() => onChange(EMPTY_CATALOGUE_FILTERS)}
          data-testid='catalogue-clear'
        >
          <Icons.close className='size-4' />
          Xoá bộ lọc
        </Button>
      )}
    </div>
  );
}
