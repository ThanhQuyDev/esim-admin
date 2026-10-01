'use client';

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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { formatDataSize, formatVnd } from '@/lib/format';
import { plansQueryOptions } from '@/features/plans/api/queries';
import { planDisplayName } from '@/features/plans/utils/plan-label';
import type { Plan } from '@/features/plans/api/types';

/** Enough rows to scan, few enough to stay one quick request. */
const RESULT_LIMIT = 25;

export type PickedPlan = {
  id: number;
  slug: string;
  packageCode: string;
  label: string;
};

/**
 * Pick a plan by searching for it, instead of typing its slug and its provider
 * package code by hand (#040).
 *
 * Both identifiers come off the same record, which is the point: the backend
 * rejects an order whose slug and packageCode disagree, and typing them
 * separately was the only way to make them disagree.
 *
 * Results are filtered by the server as the admin types — the catalogue is
 * thousands of plans, far too many to pull down and filter in the popover.
 */
export function PlanPicker({
  value,
  onChange,
  label = 'Gói eSIM',
  required
}: {
  value: PickedPlan | null;
  onChange: (plan: PickedPlan | null) => void;
  label?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const search = useDebounce(term.trim(), 300);

  const { data, isFetching } = useQuery({
    ...plansQueryOptions({
      page: 1,
      limit: RESULT_LIMIT,
      // Only plans that can actually be sold: ordering a disabled plan on a
      // customer's behalf would fail at provisioning, after the order exists.
      filters: JSON.stringify(search ? { search, isActive: true } : { isActive: true })
    }),
    // The list is only needed while the popover is open.
    enabled: open
  });

  const plans = data?.data ?? [];

  return (
    <div className='space-y-2'>
      <label className='text-sm font-medium' htmlFor='plan-picker-trigger'>
        {label}
        {required && <span className='text-destructive ml-1'>*</span>}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id='plan-picker-trigger'
            type='button'
            variant='outline'
            role='combobox'
            aria-expanded={open}
            aria-controls='plan-picker-list'
            data-testid='plan-picker-trigger'
            className='h-auto w-full justify-between py-2 text-left font-normal'
          >
            <span className={cn('truncate', !value && 'text-muted-foreground')}>
              {value ? value.label : 'Tìm và chọn gói...'}
            </span>
            <Icons.chevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-[var(--radix-popover-trigger-width)] p-0' align='start'>
          {/* The server already filtered; filtering again locally would hide
              rows that matched on a field the label does not show. */}
          <Command shouldFilter={false}>
            {/* Name / destination / region only: that is what the shared plan
                search matches, and widening it would also change what customers
                get on the storefront. The slug and package code are shown on
                every row instead, which is what the admin needs them for. */}
            <CommandInput
              placeholder='Tên gói, điểm đến, khu vực...'
              value={term}
              onValueChange={setTerm}
            />
            <CommandList id='plan-picker-list'>
              <CommandEmpty>{isFetching ? 'Đang tìm...' : 'Không tìm thấy gói nào.'}</CommandEmpty>
              <CommandGroup>
                {plans.map((plan) => (
                  <CommandItem
                    key={plan.id}
                    value={String(plan.id)}
                    data-testid={`plan-picker-option-${plan.id}`}
                    onSelect={() => {
                      onChange({
                        id: plan.id,
                        slug: plan.slug,
                        packageCode: plan.providerPlanId,
                        label: planSummary(plan)
                      });
                      setOpen(false);
                    }}
                  >
                    <Icons.check
                      className={cn(
                        'mt-1 mr-2 h-4 w-4 shrink-0 self-start',
                        value?.id === plan.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className='flex min-w-0 flex-1 flex-col'>
                      <div className='flex items-baseline justify-between gap-2'>
                        <span className='truncate font-medium'>{planDisplayName(plan)}</span>
                        <span className='shrink-0 tabular-nums'>
                          {formatVnd(Number(plan.vndPrice))}
                        </span>
                      </div>
                      <span className='text-muted-foreground truncate text-xs'>
                        {planMeta(plan)}
                      </span>
                      {/* The two identifiers the order is actually built from —
                          shown so the admin can confirm the pick (#040). */}
                      <span className='text-muted-foreground truncate font-mono text-xs'>
                        {plan.slug} · {plan.providerPlanId}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value && (
        <p className='text-muted-foreground font-mono text-xs' data-testid='plan-picker-selected'>
          slug: {value.slug} · packageCode: {value.packageCode}
        </p>
      )}
    </div>
  );
}

/** One line naming the plan, for the closed trigger. */
function planSummary(plan: Plan): string {
  const where = plan.destination?.name ?? plan.region?.name;
  return where ? `${planDisplayName(plan)} — ${where}` : planDisplayName(plan);
}

/** Destination / region, supplier, data and duration. */
function planMeta(plan: Plan): string {
  return [
    plan.destination?.name ?? plan.region?.name,
    plan.provider,
    plan.dataMb ? formatDataSize(plan.dataMb) : null,
    plan.durationDays ? `${plan.durationDays} ngày` : null
  ]
    .filter(Boolean)
    .join(' · ');
}
