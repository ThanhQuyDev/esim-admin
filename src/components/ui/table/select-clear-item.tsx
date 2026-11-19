'use client';

import { SelectItem, SelectSeparator } from '@/components/ui/select';

/**
 * The value a "Clear filters" row sends through `onValueChange`.
 * Never a real filter value.
 */
export const CLEAR_FILTER_VALUE = '__clear_filter__';

/**
 * "Clear filters" at the bottom of a select filter's own list, like the
 * faceted filters on the eSIM and plan lists (vande-2011 #029). It is only
 * there while the filter is set. Picking it sends {@link CLEAR_FILTER_VALUE},
 * which the select's `onValueChange` turns back into "all".
 */
export function SelectClearItem({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <>
      <SelectSeparator />
      <SelectItem
        value={CLEAR_FILTER_VALUE}
        className='justify-center pr-2 text-center'
        data-testid='select-clear-filter'
      >
        Clear filters
      </SelectItem>
    </>
  );
}
