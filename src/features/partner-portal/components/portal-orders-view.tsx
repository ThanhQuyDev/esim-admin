'use client';

/**
 * Attributed orders.
 *
 * A summary strip over the admin DataTable, matching how the admin console
 * presents a list screen: the numbers first, then the table with its own
 * toolbar, filters and pagination.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatVnd } from '@/lib/format';

import { myOrdersQueryOptions } from '../api/queries';
import { PortalOrdersTable } from './orders-table';

export function PortalOrdersView() {
  const { data: orders } = useQuery(myOrdersQueryOptions());

  const stats = useMemo(() => {
    const rows = orders ?? [];
    const credited = rows.filter((o) => o.commissionStatus === 'credited');
    const pending = rows.filter((o) => o.commissionStatus === 'pending');
    return {
      total: rows.length,
      revenue: rows.reduce((sum, o) => sum + (o.vndPrice ?? 0), 0),
      credited: credited.reduce((sum, o) => sum + (o.commissionVnd ?? 0), 0),
      pending: pending.reduce((sum, o) => sum + (o.commissionVnd ?? 0), 0),
      pendingCount: pending.length
    };
  }, [orders]);

  return (
    <div className='flex flex-1 flex-col space-y-4'>
      <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-3'>
        <Card className='@container/card'>
          <CardHeader>
            <CardDescription>Đơn được ghi nhận</CardDescription>
            <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
              {stats.total.toLocaleString('vi-VN')}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className='@container/card'>
          <CardHeader>
            <CardDescription>Giá trị đơn</CardDescription>
            <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
              {formatVnd(stats.revenue)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className='@container/card'>
          <CardHeader>
            <CardDescription>Hoa hồng đã duyệt</CardDescription>
            <CardTitle className='flex flex-wrap items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
              {formatVnd(stats.credited)}
              {stats.pendingCount > 0 && (
                <Badge variant='outline' className='text-xs font-normal'>
                  {formatVnd(stats.pending)} chờ đối soát
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <PortalOrdersTable />
    </div>
  );
}
