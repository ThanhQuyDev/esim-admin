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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { formatVnd } from '@/lib/format';
import { useState } from 'react';
import type { RefundOrderRequest, RefundMode } from '../api/types';

interface RefundOrderModalProps {
  orderId: number;
  orderNumber: string;
  payableVndPrice: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RefundOrderRequest) => void;
  isSubmitting: boolean;
}

export function RefundOrderModal({
  orderId,
  orderNumber,
  payableVndPrice,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting
}: RefundOrderModalProps) {
  const [mode, setMode] = useState<RefundMode>('wallet');
  const [amount, setAmount] = useState(String(payableVndPrice));
  const [reason, setReason] = useState('');
  const [adminNote, setAdminNote] = useState('');

  const amountVnd = parseInt(amount, 10);
  const isValidAmount = !isNaN(amountVnd) && amountVnd > 0 && amountVnd <= payableVndPrice;

  function handleSubmit() {
    if (!isValidAmount) return;
    onSubmit({
      mode,
      amountVnd,
      reason: reason.trim() || undefined,
      adminNote: adminNote.trim() || undefined
    });
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      setMode('wallet');
      setAmount(String(payableVndPrice));
      setReason('');
      setAdminNote('');
    }
    onOpenChange(newOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Hoàn tiền đơn hàng</DialogTitle>
          <DialogDescription>
            Xử lý hoàn tiền cho đơn hàng{' '}
            <span className='font-mono font-medium'>{orderNumber}</span>
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Order Summary */}
          <div className='rounded-lg border p-4'>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground text-sm'>Đơn hàng</span>
              <span className='font-mono text-sm font-medium'>{orderNumber}</span>
            </div>
            <div className='mt-2 flex items-center justify-between'>
              <span className='text-muted-foreground text-sm'>Số tiền đã thanh toán</span>
              <span className='text-sm font-bold'>{formatVnd(payableVndPrice)}</span>
            </div>
          </div>

          {/* Refund Mode */}
          <div className='space-y-2'>
            <Label htmlFor='refund-mode'>Phương thức hoàn tiền</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as RefundMode)}>
              <SelectTrigger id='refund-mode'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='wallet'>Hoàn vào ví eXu</SelectItem>
                <SelectItem value='direct_bank'>Hoàn trực tiếp (chuyển khoản)</SelectItem>
              </SelectContent>
            </Select>
            <p className='text-muted-foreground text-xs'>
              {mode === 'wallet'
                ? 'Tiền sẽ được hoàn vào ví eXu của người dùng, có hiệu lực 365 ngày.'
                : 'Admin sẽ xử lý chuyển khoản ngân hàng thủ công. Hệ thống chỉ ghi nhận.'}
            </p>
          </div>

          {/* Refund Amount */}
          <div className='space-y-2'>
            <Label htmlFor='refund-amount'>Số tiền hoàn (VND)</Label>
            <Input
              id='refund-amount'
              type='number'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={payableVndPrice}
            />
            {!isValidAmount && amount && (
              <p className='text-destructive text-xs'>
                Số tiền không hợp lệ. Tối đa: {formatVnd(payableVndPrice)}
              </p>
            )}
          </div>

          {/* Reason */}
          <div className='space-y-2'>
            <Label htmlFor='refund-reason'>Lý do hoàn tiền</Label>
            <Textarea
              id='refund-reason'
              placeholder='Nhập lý do hoàn tiền'
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>

          {/* Admin Note */}
          <div className='space-y-2'>
            <Label htmlFor='refund-admin-note'>Ghi chú nội bộ</Label>
            <Textarea
              id='refund-admin-note'
              placeholder='Ghi chú dành cho admin (không hiển thị cho user)'
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={2}
            />
          </div>

          {/* Impact Preview */}
          <div className='bg-muted rounded-lg p-4'>
            <p className='mb-2 text-xs font-semibold'>Tác động khi hoàn tiền:</p>
            <ul className='space-y-1 text-xs'>
              <li className='text-muted-foreground'>
                • Cashback (2%) sẽ bị thu hồi từ ví người mua
              </li>
              <li className='text-muted-foreground'>
                • Thưởng giới thiệu (10,000đ) sẽ bị thu hồi (nếu có)
              </li>
              {mode === 'wallet' && (
                <li className='text-green-600'>
                  • +{formatVnd(amountVnd || 0)} sẽ được hoàn vào ví eXu (365 ngày)
                </li>
              )}
              <li className='text-muted-foreground'>• Trạng thái đơn hàng → refunded</li>
            </ul>
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
            Xác nhận hoàn {isValidAmount ? formatVnd(amountVnd) : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
