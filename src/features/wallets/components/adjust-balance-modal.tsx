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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatVnd } from '@/lib/format';
import { useState } from 'react';
import type { ManualWalletAdjustRequest } from '../api/types';

interface AdjustBalanceModalProps {
  userId: number;
  currentBalance: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ManualWalletAdjustRequest) => void;
  isSubmitting: boolean;
}

export function AdjustBalanceModal({
  userId,
  currentBalance,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting
}: AdjustBalanceModalProps) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const amountVnd = parseInt(amount, 10);
  const isValidAmount = !isNaN(amountVnd) && amountVnd !== 0;
  const newBalance = isValidAmount ? currentBalance + amountVnd : currentBalance;
  const isCredit = amountVnd > 0;

  function handleSubmit() {
    if (!isValidAmount || !reason.trim()) return;
    onSubmit({ amountVnd, reason: reason.trim() });
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      setAmount('');
      setReason('');
    }
    onOpenChange(newOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-[450px]'>
        <DialogHeader>
          <DialogTitle>Điều chỉnh số dư</DialogTitle>
          <DialogDescription>Thêm hoặc trừ eXu từ ví của user #{userId}</DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='rounded-lg border p-3'>
            <p className='text-muted-foreground text-xs font-medium'>Số dư hiện tại</p>
            <p className='text-xl font-bold'>{formatVnd(currentBalance)}</p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='amount'>Số tiền (VND)</Label>
            <Input
              id='amount'
              type='number'
              placeholder='Nhập số dương để nạp, số âm để trừ'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className='text-muted-foreground text-xs'>
              Số dương (+): nạp thêm eXu. Số âm (−): trừ eXu.
            </p>
          </div>

          {isValidAmount && (
            <div className='rounded-lg border p-3'>
              <p className='text-muted-foreground text-xs font-medium'>Số dư sau điều chỉnh</p>
              <p className={`text-xl font-bold ${newBalance < 0 ? 'text-destructive' : ''}`}>
                {formatVnd(newBalance)}
              </p>
              {newBalance < 0 && <p className='text-destructive text-xs'>Cảnh báo: Số dư sẽ âm!</p>}
            </div>
          )}

          <div className='space-y-2'>
            <Label htmlFor='reason'>Lý do *</Label>
            <Textarea
              id='reason'
              placeholder='Nhập lý do điều chỉnh (bắt buộc)'
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => handleOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValidAmount || !reason.trim() || isSubmitting}
            isLoading={isSubmitting}
          >
            {isCredit ? 'Nạp' : 'Trừ'} {isValidAmount ? formatVnd(Math.abs(amountVnd)) : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
