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
import { Checkbox } from '@/components/ui/checkbox';
import type { OrderItem, RefundOrderRequest, RefundMode } from '../api/types';

interface RefundOrderModalProps {
  orderId: number;
  orderNumber: string;
  payableVndPrice: number;
  walletSpentVndAmount?: number | null;
  refundedAmountVnd?: number | null;
  /** Lines of the order, so part of it can be refunded on its own. */
  items?: OrderItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RefundOrderRequest) => void;
  isSubmitting: boolean;
}

export function RefundOrderModal({
  orderId,
  orderNumber,
  payableVndPrice,
  walletSpentVndAmount,
  refundedAmountVnd,
  items = [],
  open,
  onOpenChange,
  onSubmit,
  isSubmitting
}: RefundOrderModalProps) {
  const [mode, setMode] = useState<RefundMode>('wallet');
  const totalOrderValue = Number(payableVndPrice ?? 0) + Number(walletSpentVndAmount ?? 0);
  const alreadyRefunded = Number(refundedAmountVnd ?? 0);
  const maxRefundable = Math.max(0, totalOrderValue - alreadyRefunded);
  const [amount, setAmount] = useState(String(maxRefundable));
  const [reason, setReason] = useState('');
  const [adminNote, setAdminNote] = useState('');
  // Empty = refund the whole order, as before.
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);

  // Only lines still live can be refunded; an already-refunded one has nothing
  // left to give back.
  const refundableItems = items.filter((item) => item.status !== 'refunded');
  const isPartial = selectedItemIds.length > 0;

  const selectedValue = refundableItems
    .filter((item) => selectedItemIds.includes(item.id))
    .reduce((sum, item) => sum + Number(item.vndPrice ?? 0), 0);

  // A per-item refund can never exceed what those lines were worth.
  const cap = isPartial ? Math.min(selectedValue, maxRefundable) : maxRefundable;

  const amountVnd = parseInt(amount, 10);
  const isValidAmount = !isNaN(amountVnd) && amountVnd >= 0 && amountVnd <= cap;

  function toggleItem(id: number, value: boolean) {
    const next = value
      ? [...selectedItemIds, id]
      : selectedItemIds.filter((itemId) => itemId !== id);
    setSelectedItemIds(next);

    // Keep the amount in step with the selection so the admin does not have to
    // add the lines up by hand.
    const nextValue = refundableItems
      .filter((item) => next.includes(item.id))
      .reduce((sum, item) => sum + Number(item.vndPrice ?? 0), 0);
    setAmount(String(next.length > 0 ? Math.min(nextValue, maxRefundable) : maxRefundable));
  }

  function handleSubmit() {
    if (!isValidAmount) return;
    onSubmit({
      mode,
      amountVnd,
      reason: reason.trim() || undefined,
      adminNote: adminNote.trim() || undefined,
      orderItemIds: isPartial ? selectedItemIds : undefined
    });
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      setMode('wallet');
      setAmount(String(maxRefundable));
      setReason('');
      setAdminNote('');
      setSelectedItemIds([]);
    }
    onOpenChange(newOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* Capped to the viewport with a scrolling body: an order with many
          products made the popup taller than the screen and pushed the
          confirm/cancel buttons out of reach (#014). Header and footer stay put. */}
      <DialogContent className='flex max-h-[90dvh] flex-col sm:max-w-[500px]'>
        <DialogHeader className='shrink-0'>
          <DialogTitle>Hoàn tiền đơn hàng</DialogTitle>
          <DialogDescription>
            Xử lý hoàn tiền cho đơn hàng{' '}
            <span className='font-mono font-medium'>{orderNumber}</span>
          </DialogDescription>
        </DialogHeader>

        <div
          className='-mr-2 min-h-0 flex-1 space-y-4 overflow-y-auto pr-2'
          data-testid='refund-modal-body'
        >
          {/* Order Summary */}
          <div className='rounded-lg border p-4 space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground text-sm'>Đơn hàng</span>
              <span className='font-mono text-sm font-medium'>{orderNumber}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground text-sm'>Tiền mặt đã thanh toán</span>
              <span className='text-sm font-medium'>{formatVnd(payableVndPrice)}</span>
            </div>
            {Number(walletSpentVndAmount ?? 0) > 0 && (
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>eXU đã sử dụng</span>
                <span className='text-sm font-medium'>
                  {formatVnd(Number(walletSpentVndAmount ?? 0))}
                </span>
              </div>
            )}
            {alreadyRefunded > 0 && (
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>Đã hoàn trước đó</span>
                <span className='text-sm font-medium text-amber-600'>
                  -{formatVnd(alreadyRefunded)}
                </span>
              </div>
            )}
            <div className='flex items-center justify-between border-t pt-2'>
              <span className='text-sm font-semibold'>Tối đa có thể hoàn</span>
              <span className='text-sm font-bold'>{formatVnd(maxRefundable)}</span>
            </div>
          </div>

          {/* Which lines to refund (#027) */}
          {refundableItems.length > 1 && (
            <div className='space-y-2'>
              <Label>Hoàn theo từng sản phẩm</Label>
              <div className='space-y-2 rounded-lg border p-3'>
                {refundableItems.map((item) => (
                  <label key={item.id} className='flex cursor-pointer items-center gap-3 text-sm'>
                    <Checkbox
                      checked={selectedItemIds.includes(item.id)}
                      onCheckedChange={(v) => toggleItem(item.id, !!v)}
                    />
                    <span className='min-w-0 flex-1 truncate'>
                      {item.plan?.name ?? `Sản phẩm #${item.id}`}
                      {item.plan?.provider ? (
                        <span className='text-muted-foreground'> · {item.plan.provider}</span>
                      ) : null}
                      {item.quantity > 1 ? (
                        <span className='text-muted-foreground'> · x{item.quantity}</span>
                      ) : null}
                    </span>
                    <span className='font-mono text-sm'>{formatVnd(item.vndPrice)}</span>
                  </label>
                ))}
              </div>
              <p className='text-muted-foreground text-xs'>
                {isPartial
                  ? 'Chỉ những sản phẩm được chọn bị huỷ với nhà cung cấp và đánh dấu đã hoàn tiền. Các sản phẩm còn lại giữ nguyên.'
                  : 'Không chọn sản phẩm nào = hoàn tiền cho toàn bộ đơn hàng (huỷ với tất cả nhà cung cấp).'}
              </p>
            </div>
          )}

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
              max={cap}
            />
            {!isValidAmount && amount && (
              <p className='text-destructive text-xs'>
                Số tiền không hợp lệ. Tối đa: {formatVnd(cap)}
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
              <li className='text-muted-foreground'>
                {isPartial
                  ? `• ${selectedItemIds.length} sản phẩm được chọn → refunded; đơn chỉ chuyển sang refunded khi đã hoàn hết giá trị`
                  : '• Trạng thái đơn hàng → refunded'}
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className='shrink-0'>
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
