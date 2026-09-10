'use client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { payoutsQueryOptions } from '../api/queries';
import {
  approvePayoutMutation,
  rejectPayoutMutation,
  markPayoutPaidMutation
} from '../api/mutations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { formatDateTimeVn, formatVnd } from '@/lib/format';
import { toast } from 'sonner';

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

export function PayoutsView() {
  const { data: payouts = [], refetch, isLoading } = useQuery(payoutsQueryOptions());

  const approveMutation = useMutation({
    ...approvePayoutMutation,
    onSuccess: () => {
      toast.success('Đã duyệt yêu cầu rút tiền.');
      refetch();
    },
    onError: (e: Error) => toast.error(e.message || 'Duyệt thất bại')
  });

  const rejectMutation = useMutation({
    ...rejectPayoutMutation,
    onSuccess: () => {
      toast.success('Đã từ chối yêu cầu rút tiền.');
      refetch();
    },
    onError: (e: Error) => toast.error(e.message || 'Từ chối thất bại')
  });

  const markPaidMutation = useMutation({
    ...markPayoutPaidMutation,
    onSuccess: () => {
      toast.success('Đã đánh dấu đã thanh toán.');
      refetch();
    },
    onError: (e: Error) => toast.error(e.message || 'Cập nhật thất bại')
  });

  return (
    <div className='space-y-4'>
      {isLoading ? (
        <div className='flex justify-center py-12'>
          <Icons.spinner className='h-6 w-6 animate-spin' />
        </div>
      ) : payouts.length === 0 ? (
        <p className='text-muted-foreground py-12 text-center text-sm'>
          Chưa có yêu cầu rút tiền nào.
        </p>
      ) : (
        <div className='space-y-3'>
          {payouts.map((p) => (
            <div
              key={p.id}
              className='flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4'
            >
              <div>
                <div className='flex items-center gap-2'>
                  <span className='font-medium'>Đối tác #{p.partnerId}</span>
                  <Badge variant={STATUS_VARIANT[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                </div>
                <p className='text-lg font-semibold'>{formatVnd(p.amountVnd)}</p>
                {p.bankAccountInfo && (
                  <p className='text-muted-foreground text-xs'>{p.bankAccountInfo}</p>
                )}
                <p className='text-muted-foreground text-xs'>Tạo {formatDateTimeVn(p.createdAt)}</p>
              </div>
              <div className='flex gap-2'>
                {p.status === 'pending' && (
                  <>
                    <Button
                      size='sm'
                      onClick={() => approveMutation.mutate(p.id)}
                      isLoading={approveMutation.isPending}
                    >
                      Duyệt
                    </Button>
                    <Button
                      size='sm'
                      variant='destructive'
                      onClick={() => rejectMutation.mutate({ id: p.id, data: {} })}
                      isLoading={rejectMutation.isPending}
                    >
                      Từ chối
                    </Button>
                  </>
                )}
                {p.status === 'approved' && (
                  <Button
                    size='sm'
                    onClick={() => markPaidMutation.mutate({ id: p.id, data: {} })}
                    isLoading={markPaidMutation.isPending}
                  >
                    Đánh dấu đã thanh toán
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
