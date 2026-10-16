'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { useChatStore } from '../utils/store';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { formatVnd } from '@/lib/format';
import { orderValuesAfterRefund, ValueAfterRefund } from '@/features/orders/utils/refund-values';

interface CustomerOrder {
  id: number;
  orderNumber: string;
  planName: string;
  status: string;
  totalAmount: number;
  currency: string;
  /** The cash part, in dong. */
  vndPrice: number;
  payableVndPrice?: number | null;
  /** The eXU part — the whole order when paid from the wallet (doitac-1410 #068). */
  walletSpentVndAmount?: number | null;
  refundedAmountVnd?: number | null;
  createdAt: string;
}

interface OrdersResponse {
  data: CustomerOrder[];
}

function getStatusBadgeVariant(status: string) {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'delivered':
    case 'paid':
      return 'default';
    case 'processing':
    case 'pending':
      return 'secondary';
    case 'cancelled':
    case 'failed':
    case 'refunded':
      return 'destructive';
    default:
      return 'outline';
  }
}

function getStatusLabel(status: string) {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'Hoàn thành';
    case 'paid':
      return 'Đã thanh toán';
    case 'refunded':
      return 'Đã hoàn tiền';
    case 'delivered':
      return 'Đã giao';
    case 'processing':
      return 'Đang xử lý';
    case 'pending':
      return 'Chờ xử lý';
    case 'cancelled':
      return 'Đã hủy';
    case 'failed':
      return 'Thất bại';
    default:
      return status;
  }
}

export function ChatOrderWidget() {
  const roomOwnerId = useChatStore((s) => s.roomOwnerId);
  const selectedRoomId = useChatStore((s) => s.selectedRoomId);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roomOwnerId || !selectedRoomId) {
      setOrders([]);
      return;
    }

    setLoading(true);
    const filters = JSON.stringify({ userId: roomOwnerId });
    const sort = JSON.stringify([{ orderBy: 'createdAt', order: 'DESC' }]);
    apiClient<OrdersResponse>(
      // Every order of the customer (the API's ceiling is 200), not just the
      // last five (#007, test round 4); the list scrolls instead.
      `/orders?filters=${encodeURIComponent(filters)}&limit=200&sort=${encodeURIComponent(sort)}`
    )
      .then((res) => {
        setOrders(res.data ?? []);
      })
      .catch(() => {
        setOrders([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [roomOwnerId, selectedRoomId]);

  if (!selectedRoomId) return null;

  return (
    <Card className='border-border/50'>
      <CardHeader className='pb-2'>
        <CardTitle className='flex items-center gap-2 text-sm font-medium'>
          <Icons.billing className='h-4 w-4' />
          Đơn hàng khách hàng
          {!loading && orders.length > 0 && (
            <span className='text-muted-foreground font-normal'>({orders.length})</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-2'>
        {loading && (
          <div className='space-y-2'>
            <Skeleton className='h-16 w-full' />
            <Skeleton className='h-16 w-full' />
          </div>
        )}

        {!loading && orders.length === 0 && (
          <p className='text-muted-foreground text-xs'>Không có đơn hàng nào.</p>
        )}

        {!loading && orders.length > 0 && (
          // About five orders tall; the rest scroll inside the box (#007).
          <div
            className='max-h-[22rem] space-y-2 overflow-y-auto overscroll-contain pr-1'
            data-testid='chat-order-list'
          >
            {orders.map((order) => (
              /* Opens in a new tab so the admin keeps the conversation on screen
               while reading the order (#071). */
              <Link
                key={order.id}
                href={`/dashboard/orders/${order.id}`}
                target='_blank'
                rel='noopener noreferrer'
                data-testid={`chat-order-${order.id}`}
                className='bg-muted/30 hover:bg-muted/60 focus-visible:ring-primary/40 block space-y-1 rounded-lg border p-2.5 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none'
                title={`Mở chi tiết đơn ${order.orderNumber} ở tab mới`}
              >
                <div className='flex items-center justify-between gap-2'>
                  <span className='flex items-center gap-1 font-medium'>
                    {order.orderNumber}
                    <Icons.externalLink className='h-3 w-3 opacity-60' />
                  </span>
                  <Badge variant={getStatusBadgeVariant(order.status)} className='text-[10px]'>
                    {getStatusLabel(order.status)}
                  </Badge>
                </div>
                <p className='text-muted-foreground truncate'>{order.planName}</p>
                <div className='flex items-center justify-between'>
                  {/* What the order is worth: cash + eXU, less refunds — the
                    same figure as the orders table. `vndPrice` alone is only
                    the cash, so an order paid in eXU read 0đ (doitac-1410 #068). */}
                  <ValueAfterRefund
                    className='font-semibold'
                    value={orderValuesAfterRefund(order).vnd}
                    original={orderValuesAfterRefund(order).originalVnd}
                    format={formatVnd}
                  />
                  <span className='text-muted-foreground'>
                    {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
