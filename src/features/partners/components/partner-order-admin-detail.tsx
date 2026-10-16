'use client';

/**
 * "Xem chi tiết" of a marketing partner's order on "Đơn hàng đối tác"
 * (doitac-1410 #058): exactly what the partner reads on their own screen,
 * plus who the partner is and a way into the full order.
 */

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import type { MyOrderDetail } from '@/features/partner-portal/api/types';
import { OrderDetailBody } from '@/features/partner-portal/components/order-detail-dialog';

import { adminPartnerOrderDetailQueryOptions } from '../api/queries';
import type { AdminOrderPartner } from '../api/types';

export function PartnerOrderAdminDetail({ orderNumber }: { orderNumber: string }) {
  const { data, isLoading, error } = useQuery(
    adminPartnerOrderDetailQueryOptions<MyOrderDetail & { partner: AdminOrderPartner }>(
      orderNumber,
      'kol'
    )
  );

  return (
    <div className='grid min-w-0 grid-cols-1 gap-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <Button asChild variant='ghost' size='sm' className='px-2'>
          <Link href='/dashboard/partners/orders'>
            <Icons.chevronLeft className='size-4' />
            Danh sách đơn hàng
          </Link>
        </Button>
        <Button asChild variant='outline' size='sm'>
          <Link href={`/dashboard/orders/${encodeURIComponent(orderNumber)}`}>
            Mở đơn trong Quản lý đơn hàng
          </Link>
        </Button>
      </div>

      {error ? (
        <p className='py-12 text-center text-sm'>
          {(error as Error).message || 'Không tìm thấy đơn hàng này.'}
        </p>
      ) : (
        <Card className='min-w-0'>
          <CardHeader>
            <CardTitle className='font-mono text-base break-all'>{orderNumber}</CardTitle>
            {data?.partner && (
              <p className='text-sm' data-testid='detail-partner'>
                Đối tác:{' '}
                <Link
                  href={`/dashboard/partners/${data.partner.id}`}
                  className='text-primary font-medium hover:underline'
                >
                  {data.partner.name} · #{data.partner.id}
                </Link>
                {data.partner.email && (
                  <span className='text-muted-foreground'> · {data.partner.email}</span>
                )}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <OrderDetailBody data={data} isLoading={isLoading} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
