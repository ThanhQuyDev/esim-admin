'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { batchDiscountMutation } from '../api/mutations';
import { planKeys } from '../api/queries';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';

interface BatchDiscountDialogProps {
  selectedIds: number[];
  onSuccess?: () => void;
}

export function BatchDiscountDialog({ selectedIds, onSuccess }: BatchDiscountDialogProps) {
  const [open, setOpen] = useState(false);
  const [discount, setDiscount] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    ...batchDiscountMutation,
    onSuccess: () => {
      toast.success('Áp dụng discount thành công');
      queryClient.invalidateQueries({ queryKey: planKeys.all });
      setOpen(false);
      setDiscount('');
      onSuccess?.();
    },
    onError: (e) => toast.error(e.message || 'Thao tác thất bại')
  });

  function handleApply() {
    const discountNum = Number(discount);
    if (isNaN(discountNum) || discountNum < 0 || discountNum > 100) {
      toast.error('Discount phải từ 0 đến 100');
      return;
    }
    mutation.mutate({ ids: selectedIds, discount: discountNum });
  }

  return (
    <>
      <Button variant='outline' disabled={selectedIds.length === 0} onClick={() => setOpen(true)}>
        <Icons.adjustments className='mr-2 h-4 w-4' />
        Batch Discount ({selectedIds.length})
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>Áp dụng Discount</DialogTitle>
            <DialogDescription>Áp dụng cho {selectedIds.length} gói đã chọn.</DialogDescription>
          </DialogHeader>

          <div className='space-y-2'>
            <Label htmlFor='discount-input'>Discount (%)</Label>
            <Input
              id='discount-input'
              type='number'
              min={0}
              max={100}
              placeholder='20'
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleApply} isLoading={mutation.isPending} disabled={!discount}>
              Áp dụng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
