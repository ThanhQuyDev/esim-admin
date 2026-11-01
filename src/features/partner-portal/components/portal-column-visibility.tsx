'use client';

/**
 * "Hiển thị" at the top right of a partner list, as on the admin's tables
 * (doitac-3010 #026, #028): tick the columns to show; this browser remembers.
 */

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/icons';

/** The columns switched off, kept in this browser under `storageKey`. */
export function useHiddenColumns(storageKey: string) {
  const [hidden, setHidden] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(window.localStorage.getItem(storageKey) ?? '[]');
    } catch {
      return [];
    }
  });
  const toggle = (key: string) =>
    setHidden((current) => {
      const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Private mode: the choice lasts until the page is closed.
      }
      return next;
    });
  return { hidden, toggle };
}

export function ColumnVisibilityMenu({
  columns,
  hidden,
  onToggle,
  testId
}: {
  columns: { key: string; label: string }[];
  hidden: string[];
  onToggle: (key: string) => void;
  testId?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='sm' className='h-8' data-testid={testId}>
          <Icons.settings className='size-4' />
          Hiển thị
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-52'>
        <DropdownMenuLabel>Các cột hiển thị</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.key}
            checked={!hidden.includes(column.key)}
            onCheckedChange={() => onToggle(column.key)}
            onSelect={(e) => e.preventDefault()}
          >
            {column.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
