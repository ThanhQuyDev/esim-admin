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
import { formatVnd } from '@/lib/format';
import { useState } from 'react';
import type { CreatePayoutPayload } from '../api/types';

interface CreatePayoutModalProps {
  availableBalanceVnd: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreatePayoutPayload) => void;
  isSubmitting: boolean;
}

export function CreatePayoutModal({
  availableBalanceVnd,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting
}: CreatePayoutModalProps) {
  const [amount, setAmount] = useState('');
  const [bankAccountInfo, setBankAccountInfo] = useState('');

  const amountVnd = parseInt(amount, 10);
  const isValid = !isNaN(amountVnd) && amountVnd >= 50000 && amountVnd <= availableBalanceVnd;

  function handleSubmit() {
    if (!isValid) return;
    onSubmit({ amountVnd, bankAccountInfo: bankAccountInfo.trim() || undefined });
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setAmount('');
      setBankAccountInfo('');
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-[420px]'>
        <DialogHeader>
          <DialogTitle>Yêu cầu rút tiền</DialogTitle>
          <DialogDescription>Khả dụng: {formatVnd(availableBalanceVnd)}</DialogDescription>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='amount'>Số tiền muốn rút (VND)</Label>
            <Input
              id='amount'
              type='number'
              placeholder='Tối thiểu 50,000 VND'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='bankAccountInfo'>Thông tin tài khoản nhận tiền</Label>
            <Input
              id='bankAccountInfo'
              placeholder='VD: Vietcombank - 0123456789 - Nguyễn Văn A'
              value={bankAccountInfo}
              onChange={(e) => setBankAccountInfo(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => handleOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            isLoading={isSubmitting}
          >
            Gửi yêu cầu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
