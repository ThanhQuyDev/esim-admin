'use client';
import { useSuspenseQuery, useMutation, useQuery } from '@tanstack/react-query';
import { walletQueryOptions, walletTransactionsQueryOptions } from '../api/queries';
import type { WalletTransactionType } from '../api/types';
import {
  adjustWalletBalanceMutation,
  cancelWalletBalanceMutation,
  updateWalletStatusMutation
} from '../api/mutations';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Icons } from '@/components/icons';
import { formatVnd } from '@/lib/format';
import { useState } from 'react';
import { toast } from 'sonner';
import { AdjustBalanceModal } from './adjust-balance-modal';
import { CancelBalanceModal } from './cancel-balance-modal';
import { LockUnlockDialog } from './lock-unlock-dialog';

const TX_TYPE_LABELS: Record<WalletTransactionType, string> = {
  order_cashback: 'Hoàn tiền đơn hàng',
  order_cashback_reversal: 'Thu hồi hoàn tiền',
  referral_reward: 'Thưởng giới thiệu',
  referral_reward_reversal: 'Thu hồi thưởng giới thiệu',
  refund_to_wallet: 'Hoàn tiền vào ví',
  manual_credit: 'Cộng thủ công',
  manual_debit: 'Trừ thủ công',
  manual_cancel: 'Hủy số dư',
  redemption_capture: 'Thanh toán bằng eXU',
  redemption_release: 'Hoàn eXU giữ',
  expiry_debit: 'Hết hạn eXU'
};

interface WalletDetailSheetProps {
  userId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletDetailSheet({ userId, open, onOpenChange }: WalletDetailSheetProps) {
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [lockUnlockOpen, setLockUnlockOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');

  const { data: wallet } = useSuspenseQuery(walletQueryOptions(userId));
  const { data: transactions = [], isLoading: txLoading } = useQuery({
    ...walletTransactionsQueryOptions(userId),
    enabled: open
  });

  const adjustMutation = useMutation({
    ...adjustWalletBalanceMutation,
    onSuccess: (result) => {
      toast.success(
        `Đã điều chỉnh số dư cho user #${userId}. Số dư mới: ${formatVnd(result.balanceAfterVnd)}`
      );
      setAdjustOpen(false);
    },
    onError: () => {
      toast.error('Điều chỉnh số dư thất bại');
    }
  });

  const cancelMutation = useMutation({
    ...cancelWalletBalanceMutation,
    onSuccess: () => {
      toast.success(`Đã hủy toàn bộ số dư của user #${userId}`);
      setCancelOpen(false);
    },
    onError: () => {
      toast.error('Hủy số dư thất bại');
    }
  });

  const statusMutation = useMutation({
    ...updateWalletStatusMutation,
    onSuccess: (result) => {
      toast.success(
        result.status === 'active'
          ? `Đã mở khóa ví cho user #${userId}`
          : `Đã khóa ví cho user #${userId}`
      );
      setLockUnlockOpen(false);
    },
    onError: () => {
      toast.error('Cập nhật trạng thái thất bại');
    }
  });

  return (
    <>
      <AdjustBalanceModal
        userId={userId}
        currentBalance={wallet.balanceVnd}
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        onSubmit={(data) => adjustMutation.mutate({ userId, data })}
        isSubmitting={adjustMutation.isPending}
      />
      <CancelBalanceModal
        userId={userId}
        currentBalance={wallet.balanceVnd}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        onSubmit={(data) => cancelMutation.mutate({ userId, data })}
        isSubmitting={cancelMutation.isPending}
      />
      <LockUnlockDialog
        userId={userId}
        currentStatus={wallet.status}
        open={lockUnlockOpen}
        onOpenChange={setLockUnlockOpen}
        onSubmit={(data) => statusMutation.mutate({ userId, data })}
        isSubmitting={statusMutation.isPending}
      />
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className='w-[500px] overflow-y-auto sm:max-w-[500px]'>
          <SheetHeader>
            <SheetTitle className='flex items-center gap-3'>
              Ví User #{userId}
              <Badge variant={wallet.status === 'active' ? 'default' : 'destructive'}>
                {wallet.status === 'active' ? 'Đang hoạt động' : 'Đã khóa'}
              </Badge>
            </SheetTitle>
            <SheetDescription>Chi tiết ví và các thao tác quản lý</SheetDescription>
          </SheetHeader>

          {/* Tabs */}
          <div className='mt-4 flex gap-1 rounded-lg border p-1'>
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === 'info' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              Thông tin
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === 'history' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              Lịch sử giao dịch
            </button>
          </div>

          {activeTab === 'info' && (
            <div className='mt-6 space-y-6'>
              {/* Wallet Summary */}
              <div className='grid grid-cols-2 gap-4'>
                <div className='rounded-lg border p-4'>
                  <p className='text-muted-foreground text-xs font-medium'>Số dư</p>
                  <p className='text-2xl font-bold'>{formatVnd(wallet.balanceVnd)}</p>
                </div>
                <div className='rounded-lg border p-4'>
                  <p className='text-muted-foreground text-xs font-medium'>Khả dụng</p>
                  <p className='text-2xl font-bold'>{formatVnd(wallet.availableBalanceVnd)}</p>
                </div>
              </div>

              {/* Expiry Info */}
              <div className='rounded-lg border p-4'>
                <p className='text-muted-foreground text-xs font-medium'>Thời hạn</p>
                {wallet.expiresAt ? (
                  <p className='text-sm'>
                    {new Date(wallet.expiresAt).toLocaleDateString('vi-VN')}
                    {wallet.daysLeft !== null && (
                      <span className='text-muted-foreground ml-2'>
                        (Còn {wallet.daysLeft} ngày)
                      </span>
                    )}
                  </p>
                ) : (
                  <p className='text-muted-foreground text-sm'>Chưa có</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className='flex flex-wrap gap-2'>
                <Button variant='outline' size='sm' onClick={() => setAdjustOpen(true)}>
                  <Icons.edit className='mr-2 h-4 w-4' />
                  Điều chỉnh số dư
                </Button>
                <Button variant='outline' size='sm' onClick={() => setLockUnlockOpen(true)}>
                  <Icons.lock className='mr-2 h-4 w-4' />
                  {wallet.status === 'active' ? 'Khóa ví' : 'Mở khóa ví'}
                </Button>
                <Button
                  variant='destructive'
                  size='sm'
                  disabled={wallet.balanceVnd === 0}
                  onClick={() => setCancelOpen(true)}
                >
                  <Icons.trash className='mr-2 h-4 w-4' />
                  Hủy số dư
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className='mt-6 space-y-3'>
              {txLoading ? (
                <div className='flex justify-center py-8'>
                  <Icons.spinner className='h-6 w-6 animate-spin' />
                </div>
              ) : transactions.length === 0 ? (
                <p className='text-muted-foreground py-8 text-center text-sm'>
                  Chưa có giao dịch nào.
                </p>
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
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium'>{TX_TYPE_LABELS[tx.type] || tx.type}</p>
                        {tx.reason && (
                          <p className='text-muted-foreground truncate text-xs'>{tx.reason}</p>
                        )}
                        <p className='text-muted-foreground text-xs'>
                          {new Date(tx.createdAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      <div className='text-right shrink-0'>
                        <p
                          className={`text-sm font-semibold ${
                            isCredit ? 'text-green-600' : 'text-red-600'
                          }`}
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
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
