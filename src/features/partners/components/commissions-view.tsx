'use client';
import { useQuery } from '@tanstack/react-query';
import { commissionsQueryOptions } from '../api/queries';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { formatDateTimeVn, formatVnd } from '@/lib/format';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ đơn thanh toán',
  credited: 'Đã cộng vào ví',
  reversed: 'Đã hoàn',
  rejected: 'Bị loại hoa hồng'
};
const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  pending: 'secondary',
  credited: 'default',
  reversed: 'destructive',
  rejected: 'destructive'
};

/**
 * Why a commission was refused outright (#041) — a self-referral: the buyer's
 * details were the partner's own. Spelled out here because this list is where
 * a complaint about a missing commission gets answered.
 */
const REJECTION_REASON: Record<string, string> = {
  self_account: 'Đơn do chính tài khoản của đối tác đặt',
  self_email: 'Email khách trùng email đăng ký của đối tác',
  self_phone: 'Số điện thoại khách trùng số đăng ký của đối tác',
  self_tax_code: 'Mã số thuế trên hoá đơn trùng mã số thuế của đối tác',
  self_bank_account: 'Trùng tài khoản ngân hàng nhận hoa hồng của đối tác'
};

export function CommissionsView() {
  const { data, isLoading } = useQuery(commissionsQueryOptions({ limit: 50 }));
  const commissions = data?.data ?? [];

  return (
    <div className='space-y-4'>
      {isLoading ? (
        <div className='flex justify-center py-12'>
          <Icons.spinner className='h-6 w-6 animate-spin' />
        </div>
      ) : commissions.length === 0 ? (
        <p className='text-muted-foreground py-12 text-center text-sm'>Chưa có hoa hồng nào.</p>
      ) : (
        <div className='space-y-3'>
          {commissions.map((c) => (
            <div
              key={c.id}
              className='flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4'
            >
              <div>
                <div className='flex items-center gap-2'>
                  <span className='font-medium'>Đối tác #{c.partnerId}</span>
                  <Badge variant='outline'>Đơn #{c.orderId}</Badge>
                  {c.tierSnapshot && <Badge variant='outline'>{c.tierSnapshot}</Badge>}
                </div>
                <p className='text-muted-foreground text-xs'>{formatDateTimeVn(c.createdAt)}</p>
                {c.rejectionReason && (
                  <p className='text-destructive text-xs'>
                    Tự giới thiệu — {REJECTION_REASON[c.rejectionReason] ?? c.rejectionReason}
                  </p>
                )}
              </div>
              <div className='flex items-center gap-3'>
                <span className='text-lg font-semibold'>{formatVnd(c.commissionVnd)}</span>
                <Badge variant={STATUS_VARIANT[c.status]}>{STATUS_LABEL[c.status]}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
