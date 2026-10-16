'use client';

/**
 * "Hoàn tiền" on a distribution partner's order (doitac-1410 #058).
 *
 * The admin picks whole products or single eSIMs, as on the admin's own order
 * page; each eSIM gives back its agent price, and the money goes to the
 * partner's wallet — the wallet is what the partner paid with.
 */

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatVnd } from '@/lib/format';
import type { MyPurchaseDetail } from '@/features/partner-portal/api/types';

import { partnerKeys } from '../api/queries';
import { refundPartnerPurchase } from '../api/service';

export function PartnerPurchaseRefundDialog({
  order,
  open,
  onOpenChange
}: {
  order: MyPurchaseDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [iccids, setIccids] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const isTopup = order.orderType === 'TOPUP';
  const left = Math.max(0, order.paidVnd - order.refundedVnd);

  useEffect(() => {
    if (!open) return;
    setIccids([]);
    setReason('');
  }, [open]);

  const lines = useMemo(
    () =>
      order.products.map((product) => ({
        ...product,
        openEsims: product.esims.filter((e) => e.status !== 'refunded')
      })),
    [order.products]
  );
  const unitOf = (product: MyPurchaseDetail['products'][number]) =>
    product.unitVnd ?? (product.quantity ? product.agentTotalVnd / product.quantity : 0);
  const total = isTopup
    ? left
    : Math.min(
        left,
        lines.reduce(
          (sum, p) => sum + p.openEsims.filter((e) => iccids.includes(e.iccid)).length * unitOf(p),
          0
        )
      );

  const toggle = (iccid: string) =>
    setIccids((prev) =>
      prev.includes(iccid) ? prev.filter((x) => x !== iccid) : [...prev, iccid]
    );
  const toggleProduct = (codes: string[]) =>
    setIccids((prev) =>
      codes.every((c) => prev.includes(c))
        ? prev.filter((x) => !codes.includes(x))
        : [...new Set([...prev, ...codes])]
    );

  const refund = useMutation({
    mutationFn: () =>
      refundPartnerPurchase(order.orderNumber, {
        ...(isTopup ? {} : { iccids }),
        reason: reason.trim()
      }),
    onSuccess: (result) => {
      toast.success(`Đã hoàn ${formatVnd(result.refundedVnd)} về ví ký quỹ của đối tác.`);
      void queryClient.invalidateQueries({ queryKey: partnerKeys.all });
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message)
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Hoàn tiền đơn {order.orderNumber}</DialogTitle>
          <DialogDescription>
            Tiền hoàn về ví ký quỹ của đối tác theo giá đại lý của từng eSIM. Còn có thể hoàn{' '}
            {formatVnd(left)}.
          </DialogDescription>
        </DialogHeader>

        {isTopup ? (
          <p className='text-sm'>Đơn topup được hoàn toàn bộ số tiền còn lại.</p>
        ) : (
          <div className='space-y-3' data-testid='refund-products'>
            {lines.map((product, index) => {
              const codes = product.openEsims.map((e) => e.iccid);
              const allPicked = codes.length > 0 && codes.every((c) => iccids.includes(c));
              return (
                <div key={product.itemId ?? index} className='rounded-lg border p-3'>
                  <label className='flex items-start gap-2 text-sm font-medium'>
                    <Checkbox
                      checked={allPicked}
                      disabled={codes.length === 0}
                      onCheckedChange={() => toggleProduct(codes)}
                      aria-label={`Hoàn cả ${product.planName ?? 'sản phẩm'}`}
                    />
                    <span className='min-w-0'>
                      {product.planName ?? 'Sản phẩm'} × {product.quantity}
                      <span className='text-muted-foreground block text-xs font-normal'>
                        {formatVnd(unitOf(product))} / eSIM
                        {codes.length === 0 && ' · đã hoàn hết'}
                      </span>
                    </span>
                  </label>
                  {product.openEsims.length > 0 && (
                    <ul className='mt-2 space-y-1 pl-6'>
                      {product.openEsims.map((esim) => (
                        <li key={esim.iccid}>
                          <label className='flex items-center gap-2 text-xs'>
                            <Checkbox
                              checked={iccids.includes(esim.iccid)}
                              onCheckedChange={() => toggle(esim.iccid)}
                              aria-label={`Hoàn ${esim.iccid}`}
                            />
                            <span className='font-mono break-all'>{esim.iccid}</span>
                            {esim.openReport && (
                              <span className='text-muted-foreground'>
                                ·{' '}
                                {esim.openReport === 'refund'
                                  ? 'đối tác xin hoàn tiền'
                                  : 'đối tác báo lỗi'}
                              </span>
                            )}
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className='space-y-2'>
          <Label htmlFor='purchase-refund-reason'>Lý do hoàn tiền (đối tác nhìn thấy)</Label>
          <Textarea
            id='purchase-refund-reason'
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder='Ví dụ: eSIM không kết nối được, nhà mạng xác nhận lỗi'
          />
        </div>
        <p className='text-sm'>
          Số tiền hoàn: <span className='font-semibold tabular-nums'>{formatVnd(total)}</span>
        </p>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button
            variant='destructive'
            disabled={
              refund.isPending ||
              reason.trim().length < 5 ||
              total <= 0 ||
              (!isTopup && iccids.length === 0)
            }
            onClick={() => refund.mutate()}
          >
            {refund.isPending ? 'Đang hoàn…' : 'Hoàn tiền'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
