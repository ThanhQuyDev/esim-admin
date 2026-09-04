'use client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { depositRequestsQueryOptions } from '../api/queries';
import { confirmDepositRequestMutation } from '../api/mutations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { formatVnd } from '@/lib/format';
import { toast } from 'sonner';

export function DepositRequestsView() {
  const {
    data: requests = [],
    refetch,
    isLoading
  } = useQuery(depositRequestsQueryOptions('pending'));

  const confirmMutation = useMutation({
    ...confirmDepositRequestMutation,
    onSuccess: () => {
      toast.success('Đã xác nhận nạp ký quỹ.');
      refetch();
    },
    onError: (e: Error) => toast.error(e.message || 'Xác nhận thất bại')
  });

  return (
    <div className='space-y-4'>
      {isLoading ? (
        <div className='flex justify-center py-12'>
          <Icons.spinner className='h-6 w-6 animate-spin' />
        </div>
      ) : requests.length === 0 ? (
        <p className='text-muted-foreground py-12 text-center text-sm'>
          Không có yêu cầu nạp ký quỹ nào đang chờ xác nhận.
        </p>
      ) : (
        <div className='space-y-3'>
          {requests.map((req) => (
            <div
              key={req.id}
              className='flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4'
            >
              <div>
                <div className='flex items-center gap-2'>
                  <span className='font-medium'>Đối tác #{req.partnerId}</span>
                  <Badge variant='secondary'>{req.bankTransferCode}</Badge>
                </div>
                <p className='text-lg font-semibold'>{formatVnd(req.amountVnd)}</p>
                <p className='text-muted-foreground text-xs'>
                  Tạo {new Date(req.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <Button
                size='sm'
                onClick={() => confirmMutation.mutate(req.id)}
                isLoading={confirmMutation.isPending}
              >
                <Icons.check className='mr-2 h-4 w-4' /> Xác nhận đã nhận tiền
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
