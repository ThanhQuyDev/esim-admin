'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { planDisplayName } from '@/features/plans/utils/plan-label';
import type { OrderItem } from '../api/types';

/**
 * Why a line cannot be re-ordered, in the same words the backend uses (#014).
 *
 * A line that already holds an eSIM, or one the supplier has accepted and will
 * deliver over its webhook, must never be re-ordered: `submitProviders` would buy
 * a second eSIM — real money, and a duplicate for the customer.
 */
function ineligibleReason(item: OrderItem): string | null {
  if (item.esims?.length > 0) return 'Đã có eSIM';
  if (item.orderRequestId) return 'Nhà cung cấp đã tiếp nhận, đang chờ giao';
  return null;
}

export function RetryProvisioningDialog({
  orderNumber,
  items,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting
}: {
  orderNumber: string;
  items: OrderItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (itemIds: number[]) => void;
  isSubmitting: boolean;
}) {
  const retryable = useMemo(() => items.filter((item) => !ineligibleReason(item)), [items]);
  const blocked = useMemo(() => items.filter((item) => !!ineligibleReason(item)), [items]);

  // Everything retryable starts ticked: the common case is "all of them".
  const [selected, setSelected] = useState<number[]>(() => retryable.map((item) => item.id));

  const toggle = (id: number, on: boolean) =>
    setSelected((prev) => (on ? [...prev, id] : prev.filter((value) => value !== id)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>Gọi lại API lấy eSIM — {orderNumber}</DialogTitle>
          <DialogDescription>
            Chọn sản phẩm cần gọi lại nhà cung cấp. Gọi xong, eSIM nào về ngay sẽ được gửi email cho
            khách luôn.
          </DialogDescription>
        </DialogHeader>

        {retryable.length === 0 ? (
          <p className='text-muted-foreground text-sm'>
            Không có sản phẩm nào cần gọi lại: tất cả đã có eSIM hoặc đã được nhà cung cấp tiếp
            nhận.
          </p>
        ) : (
          <div className='space-y-2'>
            {retryable.map((item) => (
              <label
                key={item.id}
                htmlFor={`retry-item-${item.id}`}
                className='flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm'
              >
                <Checkbox
                  id={`retry-item-${item.id}`}
                  checked={selected.includes(item.id)}
                  onCheckedChange={(value) => toggle(item.id, !!value)}
                  data-testid={`retry-item-${item.id}`}
                />
                <span className='min-w-0 flex-1'>
                  <span className='block font-medium'>
                    {planDisplayName(item.plan, `Sản phẩm #${item.id}`)}
                  </span>
                  <span className='text-muted-foreground text-xs'>
                    #{item.id}
                    {item.quantity > 1 ? ` · x${item.quantity}` : ''}
                    {item.plan?.provider ? ` · ${item.plan.provider}` : ''}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}

        {blocked.length > 0 && (
          <div className='space-y-2 border-t pt-3'>
            <p className='text-muted-foreground text-xs font-medium uppercase'>
              Không gọi lại được ({blocked.length})
            </p>
            {blocked.map((item) => (
              <div
                key={item.id}
                className='text-muted-foreground flex items-center justify-between gap-3 text-sm'
              >
                <span className='min-w-0 flex-1 truncate'>
                  {planDisplayName(item.plan, `Sản phẩm #${item.id}`)}
                </span>
                <Badge variant='secondary'>{ineligibleReason(item)}</Badge>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button
            type='button'
            disabled={selected.length === 0 || isSubmitting}
            isLoading={isSubmitting}
            onClick={() => onSubmit(selected)}
            data-testid='retry-submit'
          >
            Gọi lại {selected.length > 0 ? `(${selected.length})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
