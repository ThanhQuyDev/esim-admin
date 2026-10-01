'use client';

import { useState, useTransition } from 'react';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { getSortingStateParser } from '@/lib/parsers';
import { ordersQueryOptions } from '../../api/queries';
import { exportOrdersExcel } from '../../api/service';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
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
import { INVOICE_FILTER_OPTIONS } from '../../utils/invoice-filter';
import { DEFAULT_ORDER_STATUS, buildOrderApiFilters } from '../../utils/order-filters';

const columnIds = columns.map((c) => c.id).filter(Boolean) as string[];

const ORDER_KIND_OPTIONS = [
  { value: 'all', label: 'Loại đơn: Tất cả' },
  { value: 'esim', label: 'Đơn eSIM thường' },
  { value: 'affiliate', label: 'Đơn Affiliate' },
  { value: 'topup', label: 'Đơn Topup' }
] as const;

export function OrdersTable() {
  const [, startTransition] = useTransition();

  const [params, setParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    orderNumber: parseAsString,
    userEmail: parseAsString,
    iccid: parseAsString,
    planName: parseAsString,
    // Paid by default (#017): an admin opening this page is looking at real
    // sales, not at abandoned checkouts. `all` is an explicit choice, which is
    // why the default is a real value rather than null.
    status: parseAsString.withDefault(DEFAULT_ORDER_STATUS),
    invoice: parseAsString,
    kind: parseAsString,
    createdFrom: parseAsString,
    createdTo: parseAsString,
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

  // Same mapping the server used to prefetch, so the query keys match.
  // Also applied to the Excel export, so the sheet matches the screen.
  const apiFilters = buildOrderApiFilters(params);

  const apiSort = params.sort.map((s) => ({
    orderBy: s.id,
    order: s.desc ? 'DESC' : 'ASC'
  }));

  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      // Same filters as the table, so the sheet matches the screen.
      await exportOrdersExcel(filters);
    } catch (err) {
      toast.error((err as Error).message || 'Xuất Excel thất bại');
    } finally {
      setExporting(false);
    }
  };

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
          value={params.status}
          onValueChange={(value) =>
            startTransition(() => {
              setParams({ status: value, page: 1 });
            })
          }
        >
          <SelectTrigger className='w-40'>
            <SelectValue placeholder='Trạng thái' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Tất cả</SelectItem>
            <SelectItem value='pending'>Pending</SelectItem>
            <SelectItem value='paid'>Paid</SelectItem>
            <SelectItem value='failed'>Failed</SelectItem>
            <SelectItem value='refunded'>Refunded</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={params.kind ?? 'all'}
          onValueChange={(value) =>
            startTransition(() => {
              setParams({ kind: value === 'all' ? null : value, page: 1 });
            })
          }
        >
          <SelectTrigger className='w-48' aria-label='Lọc theo loại đơn'>
            <SelectValue placeholder='Loại đơn' />
          </SelectTrigger>
          <SelectContent>
            {ORDER_KIND_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Created-date range (#017). Native date inputs: an admin types or picks,
            and the value goes straight into the URL as yyyy-mm-dd. */}
        <div className='flex items-center gap-2'>
          <label htmlFor='order-created-from' className='text-muted-foreground text-sm'>
            Từ
          </label>
          <Input
            id='order-created-from'
            type='date'
            className='w-40'
            value={params.createdFrom ?? ''}
            max={params.createdTo ?? undefined}
            onChange={(e) =>
              startTransition(() => {
                setParams({ createdFrom: e.target.value || null, page: 1 });
              })
            }
          />
          <label htmlFor='order-created-to' className='text-muted-foreground text-sm'>
            đến
          </label>
          <Input
            id='order-created-to'
            type='date'
            className='w-40'
            value={params.createdTo ?? ''}
            min={params.createdFrom ?? undefined}
            onChange={(e) =>
              startTransition(() => {
                setParams({ createdTo: e.target.value || null, page: 1 });
              })
            }
          />
        </div>
        <Select
          value={params.invoice ?? 'all'}
          onValueChange={(value) =>
            startTransition(() => {
              setParams({ invoice: value === 'all' ? null : value, page: 1 });
            })
          }
        >
          <SelectTrigger className='w-56' aria-label='Lọc theo hóa đơn'>
            <SelectValue placeholder='Hóa đơn' />
          </SelectTrigger>
          <SelectContent>
            {INVOICE_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable table={table} totalRowCount={totalCount}>
        <DataTableToolbar table={table}>
          <Button variant='outline' size='sm' onClick={handleExport} disabled={exporting}>
            {exporting ? <Icons.spinner className='animate-spin' /> : <Icons.download />}
            Xuất Excel đối soát
          </Button>
        </DataTableToolbar>
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
