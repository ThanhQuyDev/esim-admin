'use client';
import { useQuery } from '@tanstack/react-query';
import { myCommissionsQueryOptions } from '../api/queries';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { formatVnd } from '@/lib/format';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ xử lý',
  credited: 'Đã cộng vào ví',
  reversed: 'Đã hoàn/hủy'
};
const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  pending: 'secondary',
  credited: 'default',
  reversed: 'destructive'
};

export function PortalCommissionsView() {
  const { data, isLoading } = useQuery(myCommissionsQueryOptions());
  const commissions = data?.data ?? [];

  if (isLoading) {
    return (
      <div className='flex justify-center py-12'>
        <Icons.spinner className='h-6 w-6 animate-spin' />
      </div>
    );
  }

  if (commissions.length === 0) {
    return (
      <p className='text-muted-foreground py-12 text-center text-sm'>
        Chưa có hoa hồng nào. Chia sẻ link tiếp thị để bắt đầu kiếm hoa hồng.
      </p>
    );
  }

  return (
    <div className='space-y-2'>
      {commissions.map((c) => (
        <div
          key={c.id}
          className='flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3'
        >
          <div>
            <p className='text-sm font-medium'>Đơn hàng #{c.orderId}</p>
            <p className='text-muted-foreground text-xs'>
              {new Date(c.createdAt).toLocaleDateString('vi-VN')}
              {c.tierSnapshot ? ` · Hạng ${c.tierSnapshot}` : ''}
            </p>
          </div>
          <div className='text-right'>
            <p className='text-sm font-semibold text-green-600'>{formatVnd(c.commissionVnd)}</p>
            <Badge variant={STATUS_VARIANT[c.status]}>{STATUS_LABEL[c.status]}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
