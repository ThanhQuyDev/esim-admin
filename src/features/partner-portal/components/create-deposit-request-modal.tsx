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
import { useState } from 'react';
import type { CreateDepositRequestPayload } from '../api/types';

interface CreateDepositRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateDepositRequestPayload) => void;
  isSubmitting: boolean;
}

export function CreateDepositRequestModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting
}: CreateDepositRequestModalProps) {
  const [amount, setAmount] = useState('');

  const amountVnd = parseInt(amount, 10);
  const isValid = !isNaN(amountVnd) && amountVnd >= 100000;

  function handleSubmit() {
    if (!isValid) return;
    onSubmit({ amountVnd });
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) setAmount('');
    onOpenChange(newOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-[420px]'>
        <DialogHeader>
          <DialogTitle>Tạo yêu cầu nạp ký quỹ</DialogTitle>
          <DialogDescription>
            Sau khi tạo, bạn sẽ nhận được mã chuyển khoản và mã QR. Ký quỹ được ghi nhận sau khi
            admin xác nhận đã nhận tiền.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-2'>
          <Label htmlFor='amount'>Số tiền muốn nạp (VND)</Label>
          <Input
            id='amount'
            type='number'
            placeholder='Tối thiểu 100,000 VND'
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
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
            Tạo yêu cầu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
