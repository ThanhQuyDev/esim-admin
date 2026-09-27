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

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';

import { myOrdersQueryOptions } from '../../api/queries';
import type { MyOrder } from '../../api/types';
import { columns } from './columns';
import { OrderDetailDialog } from '../order-detail-dialog';

function matchesSource(order: MyOrder, selected: string[]): boolean {
  if (selected.length === 0) return true;
  const source = order.linkCode ? 'link' : 'code';
  return selected.includes(source);
}

export function PortalOrdersTable() {
  const { data: orders, isLoading } = useQuery(myOrdersQueryOptions());

  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    orderNumber: parseAsString.withDefault(''),
    product: parseAsString.withDefault(''),
    commissionStatus: parseAsArrayOf(parseAsString).withDefault([]),
    customerType: parseAsArrayOf(parseAsString).withDefault([]),
    source: parseAsArrayOf(parseAsString).withDefault([])
  });

  const filtered = useMemo(() => {
    // Order code and product are separate criteria (#022): one box doing both
    // meant a partner could not narrow "đơn Nhật Bản" down to one order.
    const code = params.orderNumber.trim().toLowerCase();
    const product = params.product.trim().toLowerCase();

    return (orders ?? []).filter((order) => {
      if (code && !order.orderNumber.toLowerCase().includes(code)) return false;
      if (
        product &&
        !order.items
          .map((i) => i.planName)
          .join(' ')
          .toLowerCase()
          .includes(product)
      ) {
        return false;
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
    params.product,
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
        <DataTableToolbar table={table} />
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
