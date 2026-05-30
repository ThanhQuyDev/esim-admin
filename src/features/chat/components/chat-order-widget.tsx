'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { useChatStore } from '../utils/store';
import { apiClient } from '@/lib/api-client';

interface CustomerOrder {
  id: number;
  orderNumber: string;
  planName: string;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
}

interface OrdersResponse {
  data: CustomerOrder[];
}

function getStatusBadgeVariant(status: string) {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'delivered':
      return 'default';
    case 'processing':
    case 'pending':
      return 'secondary';
    case 'cancelled':
    case 'failed':
      return 'destructive';
    default:
      return 'outline';
  }
}

function getStatusLabel(status: string) {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'Hoàn thành';
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
      `/orders?filters=${encodeURIComponent(filters)}&limit=5&sort=${encodeURIComponent(sort)}`
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

        {!loading &&
          orders.map((order) => (
            <div key={order.id} className='bg-muted/30 rounded-lg border p-2.5 text-xs space-y-1'>
              <div className='flex items-center justify-between'>
                <span className='font-medium'>#{order.orderNumber}</span>
                <Badge variant={getStatusBadgeVariant(order.status)} className='text-[10px]'>
                  {getStatusLabel(order.status)}
                </Badge>
              </div>
              <p className='text-muted-foreground truncate'>{order.planName}</p>
              <div className='flex items-center justify-between'>
                <span className='font-semibold'>
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: order.currency || 'VND'
                  }).format(order.totalAmount)}
                </span>
                <span className='text-muted-foreground'>
                  {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
