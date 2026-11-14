'use client';

import { useState, useSyncExternalStore, useTransition } from 'react';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ordersQueryOptions } from '../../api/queries';
import { Button } from '@/components/ui/button';
import { columns } from './columns';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { DateRangeFilter } from '@/components/date-range-filter';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { INVOICE_FILTER_OPTIONS } from '../../utils/invoice-filter';
import { partnersQueryOptions } from '@/features/partners/api/queries';
import { AffiliatePartnerFilter } from './affiliate-partner-filter';
import {
  CLEARED_ORDER_FILTERS,
  hasOrderFilters,
  useOrderListFilters
} from './use-order-list-filters';

const ORDER_KIND_OPTIONS = [
  { value: 'all', label: 'Loại đơn: Tất cả' },
  { value: 'esim', label: 'Đơn eSIM thường' },
  { value: 'affiliate', label: 'Đơn Affiliate' },
  { value: 'topup', label: 'Đơn Topup' }
] as const;

const noSubscribe = () => () => {};

/**
 * The orders list is drawn in the browser only, the server sends its skeleton.
 * Since the console renders pages on the first paint (vande #040) the server
 * drew this table's Suspense fallback while the browser drew the table, and
 * every load ended in a hydration error (React #418). Before #040 the page was
 * never server-rendered, so this keeps what the list always did.
 */
export function OrdersTable() {
  const inBrowser = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false
  );
  return inBrowser ? <OrdersTableContent /> : <OrdersTableSkeleton />;
}

function OrdersTableContent() {
  const [, startTransition] = useTransition();
  const { params, setParams, apiFilters, filters } = useOrderListFilters();

  // One search box for order number, email, ICCID and plan name (vande #021);
  // it replaces the four inputs that each took one of them.
  const [localQuery, setLocalQuery] = useState(params.q ?? '');

  const debouncedSetQuery = useDebouncedCallback((value: string) => {
    startTransition(() => {
      // The old one-field params are cleared, so they cannot narrow the
      // results without a visible input to undo them.
      setParams({
        q: value || null,
        orderNumber: null,
        userEmail: null,
        iccid: null,
        planName: null,
        page: 1
      });
    });
  }, 500);

  const { data, isLoading } = useQuery({
    ...ordersQueryOptions(filters),
    placeholderData: keepPreviousData
  });

  // Affiliate (KOL) partners for the partner filter (vande #023).
  const { data: affiliates } = useQuery(
    partnersQueryOptions({ partnerType: 'kol', page: 1, limit: 500, sort: 'newest' })
  );

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
        {/* As wide as its hint, no wider (vande-1411 #044). */}
        <div className='relative w-full md:w-[27rem]'>
          <Icons.search className='text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4' />
          <Input
            placeholder='Tìm theo mã đơn hàng, email, ICCID hoặc tên gói cước...'
            value={localQuery}
            onChange={(e) => {
              setLocalQuery(e.target.value);
              debouncedSetQuery(e.target.value);
            }}
            className='pl-8'
            data-testid='orders-search'
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
        {/* One affiliate partner's orders (vande #023). */}
        <AffiliatePartnerFilter
          partners={affiliates?.data ?? []}
          value={params.partner}
          onChange={(partner) =>
            startTransition(() => {
              setParams({ partner, page: 1 });
            })
          }
        />
        {/* Created-date range (#017). Native date inputs: an admin types or picks,
            and the value goes straight into the URL as yyyy-mm-dd. */}
        {/* The shared time filter (doitac-3010 #031). */}
        <DateRangeFilter
          label='Ngày tạo'
          className='h-8'
          from={params.createdFrom ?? undefined}
          to={params.createdTo ?? undefined}
          onChange={(range) =>
            startTransition(() => {
              setParams({
                createdFrom: range.from ?? null,
                createdTo: range.to ?? null,
                page: 1
              });
            })
          }
          testId='orders-created'
        />
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
        {/* English checkouts, prices in $ (doitac-3010 #043). */}
        <Select
          value={params.usd === '1' ? 'usd' : 'all'}
          onValueChange={(value) =>
            startTransition(() => {
              setParams({ usd: value === 'usd' ? '1' : null, page: 1 });
            })
          }
        >
          <SelectTrigger
            className='w-52'
            aria-label='Lọc theo tiền tệ khách xem'
            data-testid='orders-usd'
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Khách xem giá: Tất cả</SelectItem>
            <SelectItem value='usd'>Khách xem giá $ (bản tiếng Anh)</SelectItem>
          </SelectContent>
        </Select>
        {/* Orders with eSIMs the supplier has not taken (vande-0411 #010). */}
        <Select
          value={params.esimError === '1' ? 'error' : 'all'}
          onValueChange={(value) =>
            startTransition(() => {
              setParams({ esimError: value === 'error' ? '1' : null, page: 1 });
            })
          }
        >
          <SelectTrigger
            className='w-44'
            aria-label='Lọc đơn có eSIM lỗi'
            data-testid='orders-esim-error'
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>eSIM: Tất cả</SelectItem>
            <SelectItem value='error'>Đơn có eSIM lỗi</SelectItem>
          </SelectContent>
        </Select>
        {/* "Clear filters" at the end of the row, as on the eSIM and plan
            lists (vande-1411 #044). */}
        {hasOrderFilters(params) && (
          <Button
            aria-label='Đặt lại bộ lọc'
            variant='outline'
            size='sm'
            className='h-9 border-dashed'
            data-testid='orders-reset-filters'
            onClick={() => {
              setLocalQuery('');
              startTransition(() => {
                setParams(CLEARED_ORDER_FILTERS);
              });
            }}
          >
            <Icons.close className='h-4 w-4' />
            Đặt lại
          </Button>
        )}
      </div>
      {params.usd === '1' && <PaymentUsdStats filters={apiFilters} />}

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

/**
 * How many English ($) checkouts never got paid (doitac-3010 #043): the figure
 * the admin reads to decide on a USD gateway. Same filters as the list, minus
 * the status, so the share is of every $ order in the period.
 */
function PaymentUsdStats({ filters }: { filters: Record<string, unknown> }) {
  const base: Record<string, unknown> = { ...filters, usdCheckout: true };
  delete base.status;
  const count = (extra: Record<string, unknown>) => ({
    page: 1,
    limit: 1,
    filters: JSON.stringify({ ...base, ...extra })
  });
  const { data: all } = useQuery(ordersQueryOptions(count({})));
  const { data: unpaid } = useQuery(ordersQueryOptions(count({ status: ['pending', 'failed'] })));
  if (!all || !unpaid) return null;
  const total = all.totalCount ?? 0;
  const failed = unpaid.totalCount ?? 0;
  const share = total > 0 ? Math.round((failed / total) * 1000) / 10 : 0;
  return (
    <p className='text-muted-foreground text-sm' data-testid='payment-usd-stats'>
      Khách xem giá $ (bản tiếng Anh): <b className='text-foreground'>{total}</b> đơn, trong đó{' '}
      <b className='text-foreground'>{failed}</b>
      {' đơn "payment $" chưa thanh toán được '}
      (pending/failed) — <b className='text-foreground'>{share}%</b>.
    </p>
  );
}
