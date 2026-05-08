'use client';
import { useSuspenseQuery, useMutation } from '@tanstack/react-query';
import { walletQueryOptions } from '../api/queries';
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

interface WalletDetailSheetProps {
  userId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletDetailSheet({ userId, open, onOpenChange }: WalletDetailSheetProps) {
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [lockUnlockOpen, setLockUnlockOpen] = useState(false);

  const { data: wallet } = useSuspenseQuery(walletQueryOptions(userId));

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
                    <span className='text-muted-foreground ml-2'>(Còn {wallet.daysLeft} ngày)</span>
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
        </SheetContent>
      </Sheet>
    </>
  );
}
