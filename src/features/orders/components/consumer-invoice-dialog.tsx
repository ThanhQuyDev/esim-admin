'use client';

/**
 * "Số hóa đơn VAT" for an order the customer asked no invoice for
 * (doitac-3010 #044): issued to them as a consumer, so only the number is
 * needed — no company details, no email.
 */

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

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
import { Icons } from '@/components/icons';

import { issueConsumerInvoiceMutation } from '../api/mutations';

export function ConsumerInvoiceDialog({
  orderId,
  orderNumber,
  open,
  onOpenChange
}: {
  orderId: number;
  orderNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  useEffect(() => {
    if (open) setInvoiceNumber('');
  }, [open]);

  const mutation = useMutation({
    ...issueConsumerInvoiceMutation,
    onSuccess: () => {
      toast.success('Đã phát hành hóa đơn VAT');
      onOpenChange(false);
    },
    onError: (e: Error) => {
      if (/409|already/i.test(e.message)) {
        toast.error('Đơn hàng này đã có hóa đơn rồi');
        return;
      }
      toast.error(e.message || 'Phát hành hóa đơn thất bại');
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md' data-testid='consumer-invoice-dialog'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Icons.fileTypePdf className='h-5 w-5' />
            Số hóa đơn VAT
          </DialogTitle>
          <DialogDescription>
            Đơn hàng <span className='font-mono'>{orderNumber}</span> — xuất cho người tiêu dùng nên
            không cần thông tin xuất hóa đơn.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-1.5'>
          <Label htmlFor='consumerInvoiceNumber'>
            Số hóa đơn VAT <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='consumerInvoiceNumber'
            placeholder='VD: 0001234'
            maxLength={50}
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
          />
        </div>
        <DialogFooter className='gap-2 sm:gap-2'>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <Button
            type='button'
            disabled={!invoiceNumber.trim()}
            isLoading={mutation.isPending}
            onClick={() => mutation.mutate({ orderId, invoiceNumber: invoiceNumber.trim() })}
          >
            <Icons.check className='mr-2 h-4 w-4' />
            Phát hành
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
