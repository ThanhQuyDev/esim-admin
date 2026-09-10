'use client';

import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { formatDateVn, formatVnd } from '@/lib/format';

import { myCouponsQueryOptions } from '../api/queries';

export function PortalCouponsView() {
  const { data, isLoading } = useQuery(myCouponsQueryOptions());
  const coupons = data ?? [];

  const copy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Đã sao chép mã ${code}.`);
  };

  if (isLoading) {
    return (
      <div className='flex justify-center py-12'>
        <Icons.spinner className='h-6 w-6 animate-spin' />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='rounded-lg border p-4'>
        <p className='text-sm font-medium'>Lưu ý về mã giảm giá</p>
        <ul className='text-muted-foreground mt-2 list-disc space-y-1 pl-5 text-xs'>
          <li>
            Mã do esim.vn cấp cho bạn. Khách nhập mã lúc thanh toán và được giảm ngay trên giá đơn
            hàng.
          </li>
          <li>
            <span className='text-foreground font-medium'>
              Hoa hồng tính trên giá trị đơn sau khi đã trừ mã giảm giá
            </span>{' '}
            — dùng mã càng sâu thì phần hoa hồng càng nhỏ tương ứng.
          </li>
          <li>
            Mã hoạt động độc lập với link tiếp thị: đơn vẫn được ghi nhận cho bạn qua link, còn mã
            chỉ để tăng tỉ lệ chốt.
          </li>
        </ul>
      </div>

      {coupons.length === 0 ? (
        <p className='text-muted-foreground py-12 text-center text-sm'>
          Bạn chưa được cấp mã giảm giá nào. Liên hệ đội ngũ esim.vn nếu chiến dịch của bạn cần mã
          riêng.
        </p>
      ) : (
        <div className='overflow-x-auto rounded-lg border'>
          <table className='w-full text-sm'>
            <thead className='bg-muted/50 text-muted-foreground text-xs'>
              <tr>
                <th className='px-3 py-2 text-left font-medium'>Mã</th>
                <th className='px-3 py-2 text-right font-medium'>Giảm</th>
                <th className='px-3 py-2 text-right font-medium'>Lượt dùng</th>
                <th className='px-3 py-2 text-right font-medium'>Đơn của bạn</th>
                <th className='px-3 py-2 text-right font-medium'>Đã giảm cho khách</th>
                <th className='px-3 py-2 text-left font-medium'>Hết hạn</th>
                <th className='px-3 py-2 text-left font-medium'>Trạng thái</th>
                <th className='px-3 py-2' />
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className='border-t'>
                  <td className='px-3 py-2 font-mono font-medium'>{c.code}</td>
                  <td className='px-3 py-2 text-right'>{c.discountPercent}%</td>
                  <td className='px-3 py-2 text-right'>
                    {c.usageCount}
                    {c.maxUsage ? ` / ${c.maxUsage}` : ''}
                  </td>
                  <td className='px-3 py-2 text-right'>{c.myOrders}</td>
                  <td className='px-3 py-2 text-right'>{formatVnd(c.discountGivenVnd)}</td>
                  <td className='text-muted-foreground px-3 py-2 text-xs'>
                    {c.expiresAt ? formatDateVn(c.expiresAt) : 'Không giới hạn'}
                  </td>
                  <td className='px-3 py-2'>
                    <Badge variant={c.isActive ? 'default' : 'secondary'}>
                      {c.isActive ? 'Đang chạy' : 'Tạm dừng'}
                    </Badge>
                  </td>
                  <td className='px-3 py-2 text-right'>
                    <Button variant='outline' size='sm' onClick={() => copy(c.code)}>
                      <Icons.copy className='mr-2 h-4 w-4' /> Sao chép
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
