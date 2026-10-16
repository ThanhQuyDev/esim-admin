'use client';

/**
 * `/dashboard/orders/ORD-…` — an order opened by its code (doitac-1410 #023).
 *
 * A ticket only knows the code the customer or partner typed, while the
 * detail page is keyed by the numeric id, so following the code used to land
 * on an empty page. This looks the code up and moves on to the real detail.
 */

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';

import { getOrders } from '../api/service';

export function OrderNumberRedirect({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const code = orderNumber.trim().replace(/^#+/, '');
  const { data, isLoading, isError } = useQuery({
    queryKey: ['orders', 'by-number', code],
    queryFn: () =>
      getOrders({
        page: 1,
        limit: 5,
        filters: JSON.stringify({ orderNumber: code, includePartnerOrders: true })
      })
  });
  const match = data?.data.find((o) => o.orderNumber.toLowerCase() === code.toLowerCase());

  useEffect(() => {
    if (match) router.replace(`/dashboard/orders/${match.id}`);
  }, [match, router]);

  if (isLoading || match) {
    return <p className='text-muted-foreground py-10 text-center text-sm'>Đang mở đơn {code}…</p>;
  }

  return (
    <div className='space-y-3 py-10 text-center'>
      <p className='text-sm'>
        {isError ? 'Không tải được đơn hàng.' : `Không tìm thấy đơn hàng có mã «${code}».`}
      </p>
      <Button asChild variant='outline' size='sm'>
        <Link href={`/dashboard/orders?orderNumber=${encodeURIComponent(code)}`}>
          Tìm trong danh sách đơn hàng
        </Link>
      </Button>
    </div>
  );
}
