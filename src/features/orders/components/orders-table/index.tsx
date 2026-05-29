'use client';

import { useState, useTransition } from 'react';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { getSortingStateParser } from '@/lib/parsers';
import { ordersQueryOptions } from '../../api/queries';
import { columns } from './columns';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';

const columnIds = columns.map((c) => c.id).filter(Boolean) as string[];

export function OrdersTable() {
  const [, startTransition] = useTransition();

  const [params, setParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    orderNumber: parseAsString,
    userEmail: parseAsString,
    iccid: parseAsString,
    planName: parseAsString,
    status: parseAsString,
    sort: getSortingStateParser(columnIds).withDefault([])
  });

  // Local state for text inputs
  const [localOrderNumber, setLocalOrderNumber] = useState(params.orderNumber ?? '');
  const [localUserEmail, setLocalUserEmail] = useState(params.userEmail ?? '');
  const [localIccid, setLocalIccid] = useState(params.iccid ?? '');
  const [localPlanName, setLocalPlanName] = useState(params.planName ?? '');

  // Debounced callbacks to sync local state → URL params
  const debouncedSetOrderNumber = useDebouncedCallback((value: string) => {
    startTransition(() => {
      setParams({ orderNumber: value || null, page: 1 });
    });
  }, 500);

  const debouncedSetUserEmail = useDebouncedCallback((value: string) => {
    startTransition(() => {
      setParams({ userEmail: value || null, page: 1 });
    });
  }, 500);

  const debouncedSetIccid = useDebouncedCallback((value: string) => {
    startTransition(() => {
      setParams({ iccid: value || null, page: 1 });
    });
  }, 500);

  const debouncedSetPlanName = useDebouncedCallback((value: string) => {
    startTransition(() => {
      setParams({ planName: value || null, page: 1 });
    });
  }, 500);

  const apiFilters: Record<string, unknown> = {};
  if (params.orderNumber) apiFilters.orderNumber = params.orderNumber;
  if (params.userEmail) apiFilters.userEmail = params.userEmail;
  if (params.iccid) apiFilters.iccid = params.iccid;
  if (params.planName) apiFilters.planName = params.planName;
  if (params.status) apiFilters.status = params.status;

  const apiSort = params.sort.map((s) => ({
    orderBy: s.id,
    order: s.desc ? 'DESC' : 'ASC'
  }));

  const filters = {
    page: params.page,
    limit: params.perPage,
    ...(Object.keys(apiFilters).length > 0 && {
      filters: JSON.stringify(apiFilters)
    }),
    ...(apiSort.length > 0 && { sort: JSON.stringify(apiSort) })
  };

  const { data, isLoading } = useQuery({
    ...ordersQueryOptions(filters),
    placeholderData: keepPreviousData
  });

  const tableData = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;
  const pageCount = Math.ceil(totalCount / params.perPage);

  const { table } = useDataTable({
    data: tableData,
    columns,
    pageCount,
    shallow: true,
    debounceMs: 500,
    initialState: {
      columnPinning: { right: ['actions'] }
    }
  });

  if (isLoading) {
    return <OrdersTableSkeleton />;
  }

  return (
    <div className='flex flex-1 flex-col space-y-4'>
      <div className='flex flex-wrap items-center gap-3'>
        <div className='relative w-56'>
          <Icons.search className='text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4' />
          <Input
            placeholder='Tìm theo mã đơn hàng...'
            value={localOrderNumber}
            onChange={(e) => {
              setLocalOrderNumber(e.target.value);
              debouncedSetOrderNumber(e.target.value);
            }}
            className='pl-8'
          />
        </div>
        <div className='relative w-56'>
          <Icons.search className='text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4' />
          <Input
            placeholder='Tìm theo email...'
            value={localUserEmail}
            onChange={(e) => {
              setLocalUserEmail(e.target.value);
              debouncedSetUserEmail(e.target.value);
            }}
            className='pl-8'
          />
        </div>
        <div className='relative w-56'>
          <Icons.search className='text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4' />
          <Input
            placeholder='Tìm theo ICCID...'
            value={localIccid}
            onChange={(e) => {
              setLocalIccid(e.target.value);
              debouncedSetIccid(e.target.value);
            }}
            className='pl-8'
          />
        </div>
        <div className='relative w-56'>
          <Icons.search className='text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4' />
          <Input
            placeholder='Tìm theo tên gói cước...'
            value={localPlanName}
            onChange={(e) => {
              setLocalPlanName(e.target.value);
              debouncedSetPlanName(e.target.value);
            }}
            className='pl-8'
          />
        </div>
        <Select
          value={params.status ?? 'all'}
          onValueChange={(value) =>
            startTransition(() => {
              setParams({ status: value === 'all' ? null : value, page: 1 });
            })
          }
        >
          <SelectTrigger className='w-40'>
            <SelectValue placeholder='Trạng thái' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Tất cả</SelectItem>
            <SelectItem value='paid'>Paid</SelectItem>
            <SelectItem value='refunded'>Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable table={table} totalRowCount={totalCount}>
        <DataTableToolbar table={table} />
      </DataTable>
    </div>
  );
}

export function OrdersTableSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4'>
      <div className='bg-muted h-10 w-full rounded' />
      <div className='bg-muted h-96 w-full rounded-lg' />
      <div className='bg-muted h-10 w-full rounded' />
    </div>
  );
}
