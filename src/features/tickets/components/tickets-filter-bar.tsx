'use client';

import { useEffect, useState } from 'react';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { TICKET_STATUS_OPTIONS } from '../constants/status';

const ALL_STATUS = '__all__';

export function TicketsFilterBar() {
  const [params, setParams] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      search: parseAsString,
      status: parseAsString
    },
    { shallow: true }
  );

  const [searchInput, setSearchInput] = useState(params.search ?? '');

  // Sync local input when URL changes (e.g. via reset).
  useEffect(() => {
    setSearchInput(params.search ?? '');
  }, [params.search]);

  const commitSearch = useDebouncedCallback((next: string) => {
    void setParams({ search: next || null, page: 1 });
  }, 400);

  const handleSearchChange = (next: string) => {
    setSearchInput(next);
    commitSearch(next);
  };

  const handleStatusChange = (next: string) => {
    void setParams({ status: next === ALL_STATUS ? null : next, page: 1 });
  };

  const handleReset = () => {
    setSearchInput('');
    void setParams({ search: null, status: null, page: 1 });
  };

  const isFiltered = Boolean(params.search) || Boolean(params.status);

  return (
    <div className='flex flex-wrap items-center gap-2 p-1'>
      <div className='relative w-full sm:w-80'>
        <Icons.search className='text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2' />
        <Input
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder='Tìm theo email khách hàng hoặc tiêu đề...'
          className='h-9 pl-8'
          aria-label='Tìm kiếm tickets'
        />
      </div>
      <Select value={params.status ?? ALL_STATUS} onValueChange={handleStatusChange}>
        <SelectTrigger className='h-9 w-[180px]'>
          <SelectValue placeholder='Trạng thái' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_STATUS}>Tất cả trạng thái</SelectItem>
          {TICKET_STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isFiltered && (
        <Button variant='outline' size='sm' className='h-9 border-dashed' onClick={handleReset}>
          <Icons.close className='mr-1 h-4 w-4' />
          Đặt lại
        </Button>
      )}
    </div>
  );
}
