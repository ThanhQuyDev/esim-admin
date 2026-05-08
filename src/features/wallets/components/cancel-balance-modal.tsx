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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { formatVnd } from '@/lib/format';
import { useState } from 'react';
import type { CancelWalletRequest } from '../api/types';

interface CancelBalanceModalProps {
  userId: number;
  currentBalance: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CancelWalletRequest) => void;
  isSubmitting: boolean;
}

export function CancelBalanceModal({
  userId,
  currentBalance,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting
}: CancelBalanceModalProps) {
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  function handleSubmit() {
    if (!reason.trim() || !confirmed) return;
    onSubmit({ reason: reason.trim() });
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      setReason('');
      setConfirmed(false);
    }
    onOpenChange(newOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-[450px]'>
        <DialogHeader>
          <DialogTitle className='text-destructive'>Hủy toàn bộ số dư</DialogTitle>
          <DialogDescription>
            Hành động này sẽ đưa số dư ví của user #{userId} về 0. Không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='bg-destructive/10 rounded-lg border border-destructive/30 p-4'>
            <p className='text-destructive text-sm font-semibold'>Cảnh báo</p>
            <p className='text-muted-foreground mt-1 text-sm'>
              Toàn bộ số dư <strong>{formatVnd(currentBalance)}</strong> sẽ bị hủy. Hành động này
              không thể hoàn tác.
            </p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='cancel-reason'>Lý do *</Label>
            <Textarea
              id='cancel-reason'
              placeholder='Nhập lý do hủy số dư (bắt buộc)'
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <div className='flex items-start gap-2'>
            <Checkbox
              id='confirm-cancel'
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
            />
            <Label htmlFor='confirm-cancel' className='text-sm leading-relaxed'>
              Tôi xác nhận muốn hủy toàn bộ số dư {formatVnd(currentBalance)} của user #{userId}
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => handleOpenChange(false)}>
            Hủy
          </Button>
          <Button
            variant='destructive'
            onClick={handleSubmit}
            disabled={!reason.trim() || !confirmed || isSubmitting}
            isLoading={isSubmitting}
          >
            Xác nhận hủy số dư
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
