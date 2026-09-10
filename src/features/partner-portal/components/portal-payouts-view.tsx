'use client';
import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { myPayoutsQueryOptions, myProfileQueryOptions, myWalletQueryOptions } from '../api/queries';
import { createPayoutRequestMutation } from '../api/mutations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { formatDateVn, formatVnd } from '@/lib/format';
import { toast } from 'sonner';
import { useState } from 'react';
import { CreatePayoutModal } from './create-payout-modal';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Bị từ chối',
  paid: 'Đã thanh toán'
};
const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  approved: 'outline',
  rejected: 'destructive',
  paid: 'default'
};

export function PortalPayoutsView() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: wallet } = useQuery(myWalletQueryOptions());
  const { data: payouts = [], isLoading, refetch } = useQuery(myPayoutsQueryOptions());
  const { data: partner } = useQuery(myProfileQueryOptions());

  const createMutation = useMutation({
    ...createPayoutRequestMutation,
    onSuccess: () => {
      toast.success('Đã gửi yêu cầu rút tiền.');
      setCreateOpen(false);
      refetch();
    },
    onError: (e: Error) => toast.error(e.message || 'Gửi yêu cầu thất bại')
  });

  return (
    <div className='space-y-4'>
      <CreatePayoutModal
        availableBalanceVnd={wallet?.availableBalanceVnd ?? 0}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(data) => createMutation.mutate(data)}
        isSubmitting={createMutation.isPending}
      />

      {/* Saved payout account — prefilled into every new request. */}
      <div className='rounded-lg border p-4'>
        <div className='flex flex-wrap items-start justify-between gap-2'>
          <div>
            <p className='text-sm font-medium'>Tài khoản thanh toán</p>
            {partner?.bankAccountNumber ? (
              <p className='text-muted-foreground mt-1 text-sm'>
                {[
                  partner.bankName,
                  partner.bankAccountNumber,
                  partner.bankAccountHolder,
                  partner.bankBranch
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            ) : (
              <p className='text-muted-foreground mt-1 text-sm'>
                Chưa lưu tài khoản nhận tiền — bạn sẽ phải nhập tay mỗi lần rút.
              </p>
            )}
          </div>
          <Link
            href='/dashboard/portal/profile'
            className='text-sm font-medium underline underline-offset-4'
          >
            {partner?.bankAccountNumber ? 'Đổi tài khoản' : 'Thêm tài khoản'}
          </Link>
        </div>
      </div>

      <div className='flex items-center justify-between'>
        <p className='text-muted-foreground text-sm'>
          Khả dụng để rút:{' '}
          <span className='font-medium'>{formatVnd(wallet?.availableBalanceVnd)}</span>
        </p>
        <Button size='sm' onClick={() => setCreateOpen(true)}>
          <Icons.add className='mr-2 h-4 w-4' /> Yêu cầu rút tiền
        </Button>
      </div>

      {isLoading ? (
        <div className='flex justify-center py-12'>
          <Icons.spinner className='h-6 w-6 animate-spin' />
        </div>
      ) : payouts.length === 0 ? (
        <p className='text-muted-foreground py-12 text-center text-sm'>
          Chưa có yêu cầu rút tiền nào.
        </p>
      ) : (
        <div className='space-y-2'>
          {payouts.map((p) => (
            <div
              key={p.id}
              className='flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3'
            >
              <div>
                <p className='text-sm font-medium'>{formatVnd(p.amountVnd)}</p>
                <p className='text-muted-foreground text-xs'>
                  {formatDateVn(p.createdAt)}
                  {p.bankAccountInfo ? ` · ${p.bankAccountInfo}` : ''}
                </p>
              </div>
              <Badge variant={STATUS_VARIANT[p.status]}>{STATUS_LABEL[p.status]}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
