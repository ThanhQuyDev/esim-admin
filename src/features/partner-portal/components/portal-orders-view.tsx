'use client';

import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { formatDateVn, formatVnd } from '@/lib/format';

import { myOrdersQueryOptions } from '../api/queries';

const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  completed: 'Hoàn tất',
  failed: 'Thất bại',
  cancelled: 'Đã hủy',
  MANUAL_INTERVENTION: 'Cần xử lý thủ công'
};

const ORDER_STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  paid: 'default',
  completed: 'default',
  failed: 'destructive',
  cancelled: 'destructive',
  MANUAL_INTERVENTION: 'destructive'
};

const COMMISSION_LABEL: Record<string, string> = {
  pending: 'Chờ xác nhận',
  credited: 'Đã cộng ví',
  reversed: 'Đã hoàn/hủy'
};

export function PortalOrdersView() {
  const { data, isLoading } = useQuery(myOrdersQueryOptions());
  const orders = data ?? [];

  if (isLoading) {
    return (
      <div className='flex justify-center py-12'>
        <Icons.spinner className='h-6 w-6 animate-spin' />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <p className='text-muted-foreground py-12 text-center text-sm'>
        Chưa có đơn hàng nào được ghi nhận qua link tiếp thị của bạn.
      </p>
    );
  }

  return (
    <div className='overflow-x-auto rounded-lg border'>
      <table className='w-full text-sm'>
        <thead className='bg-muted/50 text-muted-foreground text-xs'>
          <tr>
            <th className='px-3 py-2 text-left font-medium'>Mã đơn</th>
            <th className='px-3 py-2 text-left font-medium'>Sản phẩm</th>
            <th className='px-3 py-2 text-right font-medium'>Giá trị</th>
            <th className='px-3 py-2 text-left font-medium'>Nguồn ghi nhận</th>
            <th className='px-3 py-2 text-right font-medium'>eSIM</th>
            <th className='px-3 py-2 text-right font-medium'>Hoa hồng</th>
            <th className='px-3 py-2 text-left font-medium'>Trạng thái</th>
            <th className='px-3 py-2 text-left font-medium'>Ngày</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.orderNumber} className='border-t'>
              <td className='px-3 py-2 font-mono text-xs'>{o.orderNumber}</td>
              <td className='px-3 py-2'>
                {o.items.length === 0 ? (
                  <span className='text-muted-foreground'>—</span>
                ) : (
                  o.items.map((it, i) => (
                    <div key={`${o.orderNumber}-${i}`} className='truncate'>
                      {it.planName}
                      {it.quantity > 1 ? ` ×${it.quantity}` : ''}
                    </div>
                  ))
                )}
              </td>
              <td className='px-3 py-2 text-right font-medium'>{formatVnd(o.vndPrice)}</td>
              <td className='px-3 py-2'>
                {o.linkCode ? (
                  <span className='font-mono text-xs'>{o.linkCode}</span>
                ) : (
                  <span className='text-muted-foreground'>—</span>
                )}
              </td>
              <td className='px-3 py-2 text-right'>{o.esimCount}</td>
              <td className='px-3 py-2 text-right'>
                {o.commissionVnd == null ? (
                  <span className='text-muted-foreground'>—</span>
                ) : (
                  <div>
                    <div className='font-medium text-green-600'>{formatVnd(o.commissionVnd)}</div>
                    {o.commissionStatus && (
                      <div className='text-muted-foreground text-xs'>
                        {COMMISSION_LABEL[o.commissionStatus] ?? o.commissionStatus}
                      </div>
                    )}
                  </div>
                )}
              </td>
              <td className='px-3 py-2'>
                <Badge variant={ORDER_STATUS_VARIANT[o.status] ?? 'outline'}>
                  {ORDER_STATUS_LABEL[o.status] ?? o.status}
                </Badge>
              </td>
              <td className='text-muted-foreground px-3 py-2 text-xs'>
                {formatDateVn(o.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
