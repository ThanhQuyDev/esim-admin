'use client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { UpdateWalletStatusRequest, WalletStatus } from '../api/types';

interface LockUnlockDialogProps {
  userId: number;
  currentStatus: WalletStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UpdateWalletStatusRequest) => void;
  isSubmitting: boolean;
}

export function LockUnlockDialog({
  userId,
  currentStatus,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting
}: LockUnlockDialogProps) {
  const isLocking = currentStatus === 'active';
  const newStatus: WalletStatus = isLocking ? 'locked' : 'active';

  function handleSubmit() {
    onSubmit({ status: newStatus });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[400px]'>
        <DialogHeader>
          <DialogTitle>{isLocking ? 'Khóa ví' : 'Mở khóa ví'}</DialogTitle>
          <DialogDescription>
            {isLocking
              ? 'Khóa ví sẽ ngăn user sử dụng eXu để thanh toán.'
              : 'Mở khóa ví sẽ cho phép user sử dụng eXu trở lại.'}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='flex items-center justify-between rounded-lg border p-4'>
            <span className='text-sm font-medium'>Trạng thái hiện tại</span>
            <Badge variant={currentStatus === 'active' ? 'default' : 'destructive'}>
              {currentStatus === 'active' ? 'Đang hoạt động' : 'Đã khóa'}
            </Badge>
          </div>

          <div className='flex items-center justify-between rounded-lg border p-4'>
            <span className='text-sm font-medium'>Trạng thái mới</span>
            <Badge variant={newStatus === 'active' ? 'default' : 'destructive'}>
              {newStatus === 'active' ? 'Đang hoạt động' : 'Đã khóa'}
            </Badge>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            variant={isLocking ? 'destructive' : 'default'}
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            {isLocking ? 'Xác nhận khóa' : 'Xác nhận mở khóa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
