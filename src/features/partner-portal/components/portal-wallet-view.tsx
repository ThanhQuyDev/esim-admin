'use client';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  myWalletQueryOptions,
  myWalletTransactionsQueryOptions,
  myDepositRequestsQueryOptions
} from '../api/queries';
import { createDepositRequestMutation } from '../api/mutations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { formatDateTimeVn, formatDateVn, formatVnd } from '@/lib/format';
import { toast } from 'sonner';
import { useState } from 'react';
import { CreateDepositRequestModal } from './create-deposit-request-modal';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  cancelled: 'Đã hủy'
};
const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  pending: 'secondary',
  confirmed: 'default',
  cancelled: 'destructive'
};

export function PortalWalletView() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: wallet, isLoading: walletLoading } = useQuery(myWalletQueryOptions());
  const { data: transactions = [], isLoading: txLoading } = useQuery(
    myWalletTransactionsQueryOptions()
  );
  const { data: depositRequests = [], refetch: refetchDeposits } = useQuery(
    myDepositRequestsQueryOptions()
  );

  const createMutation = useMutation({
    ...createDepositRequestMutation,
    onSuccess: () => {
      toast.success('Đã tạo yêu cầu nạp ký quỹ. Vui lòng chuyển khoản theo hướng dẫn.');
      setCreateOpen(false);
      refetchDeposits();
    },
    onError: (e: Error) => toast.error(e.message || 'Tạo yêu cầu thất bại')
  });

  return (
    <div className='space-y-6'>
      <CreateDepositRequestModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(data) => createMutation.mutate(data)}
        isSubmitting={createMutation.isPending}
      />

      <div className='grid gap-4 sm:grid-cols-3'>
        <div className='rounded-lg border p-4'>
          <p className='text-muted-foreground text-xs font-medium'>Số dư ký quỹ</p>
          <p className='text-2xl font-bold'>
            {walletLoading ? '—' : formatVnd(wallet?.balanceVnd)}
          </p>
        </div>
        <div className='rounded-lg border p-4'>
          <p className='text-muted-foreground text-xs font-medium'>Khả dụng</p>
          <p className='text-2xl font-bold'>
            {walletLoading ? '—' : formatVnd(wallet?.availableBalanceVnd)}
          </p>
        </div>
        <div className='rounded-lg border p-4'>
          <p className='text-muted-foreground text-xs font-medium'>Đang chờ rút</p>
          <p className='text-2xl font-bold'>
            {walletLoading ? '—' : formatVnd(wallet?.pendingPayoutVnd)}
          </p>
        </div>
      </div>

      <div className='flex justify-end'>
        <Button size='sm' onClick={() => setCreateOpen(true)}>
          <Icons.add className='mr-2 h-4 w-4' /> Tạo yêu cầu nạp ký quỹ
        </Button>
      </div>

      {depositRequests.length > 0 && (
        <div className='space-y-2'>
          <p className='text-sm font-medium'>Yêu cầu nạp ký quỹ gần đây</p>
          {depositRequests.slice(0, 5).map((req) => (
            <div
              key={req.id}
              className='flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3'
            >
              <div>
                <p className='text-sm font-medium'>{formatVnd(req.amountVnd)}</p>
                <p className='text-muted-foreground text-xs'>
                  Mã CK: {req.bankTransferCode} · {formatDateVn(req.createdAt)}
                </p>
              </div>
              <Badge variant={STATUS_VARIANT[req.status]}>{STATUS_LABEL[req.status]}</Badge>
            </div>
          ))}
        </div>
      )}

      <div className='space-y-2'>
        <p className='text-sm font-medium'>Lịch sử giao dịch</p>
        {txLoading ? (
          <div className='flex justify-center py-8'>
            <Icons.spinner className='h-6 w-6 animate-spin' />
          </div>
        ) : transactions.length === 0 ? (
          <p className='text-muted-foreground py-8 text-center text-sm'>Chưa có giao dịch nào.</p>
        ) : (
          transactions.map((tx) => {
            const isCredit = tx.amountVnd > 0;
            return (
              <div key={tx.id} className='flex items-start gap-3 rounded-lg border p-3'>
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    isCredit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}
                >
                  {isCredit ? (
                    <Icons.trendingUp className='h-4 w-4' />
                  ) : (
                    <Icons.trendingDown className='h-4 w-4' />
                  )}
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='text-sm font-medium'>{tx.reason || tx.type}</p>
                  <p className='text-muted-foreground text-xs'>{formatDateTimeVn(tx.createdAt)}</p>
                </div>
                <div className='shrink-0 text-right'>
                  <p
                    className={`text-sm font-semibold ${isCredit ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {isCredit ? '+' : ''}
                    {formatVnd(tx.amountVnd)}
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    Số dư: {formatVnd(tx.balanceAfterVnd)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
