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
import { useState } from 'react';
import type { AdjustWalletPayload } from '../api/types';

interface AdjustPartnerWalletModalProps {
  partnerId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AdjustWalletPayload) => void;
  isSubmitting: boolean;
}

export function AdjustPartnerWalletModal({
  partnerId,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting
}: AdjustPartnerWalletModalProps) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const amountVnd = parseInt(amount, 10);
  const isValidAmount = !isNaN(amountVnd) && amountVnd !== 0;
  const isCredit = amountVnd > 0;

  function handleSubmit() {
    if (!isValidAmount) return;
    onSubmit({ amountVnd, reason: reason.trim() || undefined });
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
          <DialogTitle>Điều chỉnh ví đối tác</DialogTitle>
          <DialogDescription>
            Nạp hoặc trừ số dư ký quỹ / hoa hồng cho đối tác #{partnerId}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='partner-adjust-amount'>Số tiền (VND)</Label>
            <Input
              id='partner-adjust-amount'
              type='number'
              placeholder='Nhập số dương để nạp, số âm để trừ'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='partner-adjust-reason'>Lý do</Label>
            <Textarea
              id='partner-adjust-reason'
              placeholder='Nhập lý do điều chỉnh'
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
            disabled={!isValidAmount || isSubmitting}
            isLoading={isSubmitting}
          >
            {isCredit ? 'Nạp' : 'Trừ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
