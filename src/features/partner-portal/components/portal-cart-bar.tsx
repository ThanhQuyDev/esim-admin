'use client';

/**
 * Between the filters and the price list (doitac-1410 #035): the deposit
 * balance, how many plans are in the cart (not eSIMs), the cart total, the
 * cart icon with its eSIM count, "Thanh toán", and the price list download.
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
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
import { formatVnd } from '@/lib/format';

import { myWalletQueryOptions, partnerPortalKeys } from '../api/queries';
import { catalogueExportUrl, purchaseCart, quoteCart } from '../api/service';
import type { CatalogueFilters } from '../api/types';
import {
  cartLineKey,
  clearCart,
  removeFromCart,
  setCartQuantity,
  usePartnerCart
} from '../lib/partner-cart';
import { PortalCartFileImport } from './portal-cart-file-import';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function CartCheckoutDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const cart = usePartnerCart();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const emailValid = !email.trim() || EMAIL.test(email.trim());
  const items = cart.map((l) => ({
    planId: l.planId,
    quantity: l.quantity,
    ...(l.periodNum && l.periodNum > 1 ? { periodNum: l.periodNum } : {})
  }));

  // Priced by the server, the same way the order will be (doitac-1410 #035).
  const { data: quote, isFetching } = useQuery({
    queryKey: [...partnerPortalKeys.all, 'cart-quote', items],
    queryFn: () => quoteCart(items),
    enabled: open && items.length > 0
  });

  const pay = useMutation({
    mutationFn: () =>
      purchaseCart({ items, ...(email.trim() ? { recipientEmail: email.trim() } : {}) }),
    onSuccess: (result) => {
      clearCart();
      setEmail('');
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: partnerPortalKeys.all });
      const parts = [
        `Đã đặt ${result.quantity} eSIM (${result.planCount} gói) — đơn ${result.orderNumber}.`,
        result.refundedVnd > 0
          ? `Hoàn ${formatVnd(result.refundedVnd)} cho gói nhà cung cấp chưa nhận.`
          : '',
        email.trim() ? `Mã QR gửi tới ${email.trim()}.` : 'Tải file Excel ở trang Đơn hàng.'
      ];
      toast.success(parts.filter(Boolean).join(' '));
    },
    onError: (e: Error) => toast.error(e.message || 'Thanh toán thất bại.')
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[640px]' data-testid='cart-checkout-dialog'>
        <DialogHeader>
          <DialogTitle>Thanh toán giỏ hàng</DialogTitle>
          <DialogDescription>
            Kiểm tra gói cước, số lượng và giá trước khi trừ ví ký quỹ. Cả giỏ được đặt trong một
            đơn hàng.
          </DialogDescription>
        </DialogHeader>

        {cart.length === 0 ? (
          <p className='text-muted-foreground py-6 text-center text-sm'>Giỏ hàng đang trống.</p>
        ) : (
          <div className='space-y-4'>
            <ul className='divide-y rounded-lg border'>
              {cart.map((line) => {
                const priced = quote?.lines.find(
                  (l) =>
                    l.planId === line.planId && (l.periodNum ?? null) === (line.periodNum ?? null)
                );
                return (
                  <li key={cartLineKey(line)} className='flex flex-wrap items-center gap-3 p-3'>
                    <div className='min-w-0 basis-full sm:basis-0 sm:flex-1'>
                      <p className='truncate text-sm font-medium'>{line.name}</p>
                      <p className='text-muted-foreground text-xs'>
                        {line.destinationName ?? '—'} ·{' '}
                        {formatVnd(priced?.unitPriceVnd ?? line.unitPriceVnd)} / eSIM
                      </p>
                      {priced?.rejection && (
                        <p className='text-destructive text-xs'>{priced.rejection}</p>
                      )}
                    </div>
                    <Input
                      type='number'
                      min={1}
                      step={1}
                      className='w-20'
                      aria-label={`Số lượng ${line.name}`}
                      value={line.quantity}
                      onChange={(e) => {
                        const v = Math.trunc(Number(e.target.value));
                        if (v > 0) setCartQuantity(cartLineKey(line), v);
                      }}
                    />
                    <span className='ml-auto w-28 text-right text-sm font-medium tabular-nums sm:ml-0'>
                      {formatVnd(priced?.totalVnd ?? line.unitPriceVnd * line.quantity)}
                    </span>
                    <Button
                      size='icon'
                      variant='ghost'
                      aria-label={`Bỏ ${line.name}`}
                      onClick={() => removeFromCart(cartLineKey(line))}
                    >
                      <Icons.trash className='size-4' />
                    </Button>
                  </li>
                );
              })}
            </ul>

            <div className='bg-muted/50 space-y-1 rounded-lg p-3 text-sm'>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Số gói / số eSIM</span>
                <span className='tabular-nums'>
                  {quote?.planCount ?? cart.length} gói ·{' '}
                  {quote?.esimCount ?? cart.reduce((s, l) => s + l.quantity, 0)} eSIM
                </span>
              </div>
              <div className='flex justify-between font-semibold'>
                <span>Tổng trừ ví</span>
                <span className='tabular-nums'>
                  {isFetching ? '…' : formatVnd(quote?.totalVnd ?? 0)}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Số dư sau khi mua</span>
                <span className='tabular-nums'>
                  {formatVnd(Math.max(0, (quote?.balanceVnd ?? 0) - (quote?.totalVnd ?? 0)))}
                </span>
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='cart-email'>Email nhận mã QR eSIM</Label>
              <Input
                id='cart-email'
                type='email'
                placeholder='khachhang@email.com'
                value={email}
                aria-invalid={!emailValid}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p
                className={
                  emailValid ? 'text-muted-foreground text-xs' : 'text-destructive text-xs'
                }
              >
                {emailValid
                  ? 'Mã QR của mọi eSIM trong đơn được gửi tới email này, kèm logo thương hiệu của bạn. Để trống thì tải file Excel ở trang Đơn hàng.'
                  : 'Email không hợp lệ.'}
              </p>
            </div>

            {quote?.rejection && <p className='text-destructive text-sm'>{quote.rejection}</p>}
          </div>
        )}

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Tiếp tục chọn gói
          </Button>
          <Button
            disabled={
              cart.length === 0 || !emailValid || isFetching || !quote || Boolean(quote.rejection)
            }
            isLoading={pay.isPending}
            onClick={() => pay.mutate()}
          >
            {`Xác nhận trừ ${formatVnd(quote?.totalVnd ?? 0)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PortalCartBar({ filters }: { filters: CatalogueFilters }) {
  const cart = usePartnerCart();
  const { data: wallet } = useQuery(myWalletQueryOptions());
  const [checkout, setCheckout] = useState(false);
  const esims = cart.reduce((sum, l) => sum + l.quantity, 0);
  const total = cart.reduce((sum, l) => sum + l.unitPriceVnd * l.quantity, 0);

  return (
    <>
      <div
        className='bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3'
        data-testid='cart-bar'
      >
        <div className='flex flex-wrap items-center gap-x-5 gap-y-2 text-sm'>
          <span>
            <span className='text-muted-foreground'>Số dư khả dụng: </span>
            <strong className='tabular-nums'>{formatVnd(wallet?.availableBalanceVnd ?? 0)}</strong>
          </span>
          <span>
            <span className='text-muted-foreground'>Gói: </span>
            <strong data-testid='cart-plan-count'>{cart.length}</strong>
          </span>
          <span>
            <span className='text-muted-foreground'>Tổng: </span>
            <strong className='tabular-nums' data-testid='cart-total'>
              {formatVnd(total)}
            </strong>
          </span>
          <span className='text-primary inline-flex items-center gap-1 font-semibold'>
            <Icons.shoppingCart className='size-4' />
            <Badge variant='secondary' data-testid='cart-esim-count'>
              {esims}
            </Badge>
          </span>
          <Button size='sm' disabled={cart.length === 0} onClick={() => setCheckout(true)}>
            Thanh toán
          </Button>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          {/* Many eSIMs at once from a file (doitac-1410 #084). */}
          <PortalCartFileImport />
          <Button asChild size='sm' variant='outline'>
            <a href={catalogueExportUrl(filters)} data-testid='catalogue-export'>
              <Icons.download className='size-4' />
              Xuất bảng giá
            </a>
          </Button>
        </div>
      </div>
      <CartCheckoutDialog open={checkout} onOpenChange={setCheckout} />
    </>
  );
}
