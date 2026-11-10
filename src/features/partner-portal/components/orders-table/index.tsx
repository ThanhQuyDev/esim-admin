'use client';

/**
 * Attributed orders, on the admin console's DataTable.
 *
 * The portal's orders endpoint returns the partner's rows in one response
 * rather than a page at a time, so the filtering and slicing happen here and
 * the table is handed one page. Everything the partner sees and touches —
 * toolbar, faceted filters, column visibility, pagination — is the same
 * component the admin tables use.
 */

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { toast } from 'sonner';

import { DateRangeFilter } from '@/components/date-range-filter';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';

import { myOrdersQueryOptions } from '../../api/queries';
import { exportMyOrders } from '../../api/service';
import type { MyOrder } from '../../api/types';
import { columns } from './columns';
import { OrderDetailDialog } from '../order-detail-dialog';

/**
 * The search box (doitac-0911 #013): order code, a product, the link code
 * (typed as "ABC123", "/go/ABC123" or the whole link) or the discount code.
 */
export function matchesSearch(order: MyOrder, text: string): boolean {
  const query = text
    .trim()
    .toLowerCase()
    .replace(/^#+\s*/, '')
    .replace(/^https?:\/\/[^/]+/, '')
    .replace(/^\/?go\//, '');
  if (!query) return true;
  return [
    order.orderNumber,
    ...order.items.map((i) => i.planName),
    order.linkCode ?? '',
    order.couponCode ?? ''
  ].some((value) =>
    String(value ?? '')
      .toLowerCase()
      .includes(query)
  );
}

/** The order's day in Vietnam, yyyy-MM-dd, for the "Ngày mua" filter. */
function vnDay(value: string): string {
  return new Date(value).toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
}

function matchesSource(order: MyOrder, selected: string[]): boolean {
  if (selected.length === 0) return true;
  const source = order.linkCode ? 'link' : 'code';
  return selected.includes(source);
}

export function PortalOrdersTable() {
  const { data: orders, isLoading } = useQuery(myOrdersQueryOptions());

  const [params, setParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    orderNumber: parseAsString.withDefault(''),
    // "Ngày mua" (doitac-0911 #013): none means every order.
    from: parseAsString.withDefault(''),
    to: parseAsString.withDefault(''),
    commissionStatus: parseAsArrayOf(parseAsString).withDefault([]),
    customerType: parseAsArrayOf(parseAsString).withDefault([]),
    source: parseAsArrayOf(parseAsString).withDefault([])
  });

  const filtered = useMemo(() => {
    return (orders ?? []).filter((order) => {
      if (!matchesSearch(order, params.orderNumber)) return false;
      if (params.from || params.to) {
        const day = vnDay(order.createdAt);
        if (params.from && day < params.from) return false;
        if (params.to && day > params.to) return false;
      }
      if (
        params.commissionStatus.length > 0 &&
        !params.commissionStatus.includes(order.commissionStatus ?? '')
      ) {
        return false;
      }
      if (
        params.customerType.length > 0 &&
        !params.customerType.includes(order.customerType ?? 'returning')
      ) {
        return false;
      }
      return matchesSource(order, params.source);
    });
  }, [
    orders,
    params.orderNumber,
    params.from,
    params.to,
    params.commissionStatus,
    params.customerType,
    params.source
  ]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / params.perPage));
  // A filter that shrinks the list can leave the URL pointing past the end.
  const page = Math.min(params.page, pageCount);
  const pageRows = useMemo(
    () => filtered.slice((page - 1) * params.perPage, page * params.perPage),
    [filtered, page, params.perPage]
  );

  // Which order the detail dialog is showing (#026).
  const [detailOrder, setDetailOrder] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const { table } = useDataTable({
    data: pageRows,
    columns,
    pageCount,
    shallow: true,
    debounceMs: 500,
    meta: { onViewDetail: setDetailOrder }
  });

  if (isLoading) return <PortalOrdersTableSkeleton />;

  return (
    <>
      <OrderDetailDialog
        orderNumber={detailOrder}
        onOpenChange={(open) => !open && setDetailOrder(null)}
      />
      <DataTable table={table} totalRowCount={filtered.length}>
        <DataTableToolbar table={table}>
          {/* "Ngày mua: Mọi thời gian" and "Xuất Excel" beside "Hiển thị"
              (doitac-0911 #013). */}
          <DateRangeFilter
            label='Ngày mua'
            className='h-8'
            from={params.from || undefined}
            to={params.to || undefined}
            onChange={(range) =>
              void setParams({ from: range.from ?? null, to: range.to ?? null, page: 1 })
            }
            testId='orders-purchase-date'
          />
          <Button
            size='sm'
            variant='outline'
            className='h-8'
            disabled={exporting || (orders ?? []).length === 0}
            onClick={async () => {
              setExporting(true);
              try {
                await exportMyOrders();
              } catch (e) {
                toast.error((e as Error).message);
              } finally {
                setExporting(false);
              }
            }}
          >
            {exporting ? <Icons.spinner className='animate-spin' /> : <Icons.download />}
            Xuất Excel
          </Button>
        </DataTableToolbar>
      </DataTable>
    </>
  );
}

export function PortalOrdersTableSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4'>
      <div className='bg-muted h-10 w-full rounded' />
      <div className='bg-muted h-96 w-full rounded-lg' />
      <div className='bg-muted h-10 w-full rounded' />
    </div>
  );
}
