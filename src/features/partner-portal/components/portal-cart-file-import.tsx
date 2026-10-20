'use client';

/**
 * "Nhập từ file" beside the cart (doitac-1410 #084): many eSIMs at once from
 * a spreadsheet — the price list export with a "Số lượng" column filled in,
 * or the template. The file is priced by the server first; rows with an
 * "Email nhận QR" become one order per email, the other rows one order whose
 * QR codes go to the email typed here (or none, then the Excel file on the
 * Orders page). Each order is paid through the cart checkout, as before.
 */

import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { formatVnd } from '@/lib/format';

import { partnerPortalKeys } from '../api/queries';
import { CART_FILE_TEMPLATE_URL, previewCartFile, purchaseCart } from '../api/service';
import type { CartFilePreview } from '../api/types';
import { addToCart } from '../lib/partner-cart';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function FilePreviewDialog({
  preview,
  fileName,
  onClose
}: {
  preview: CartFilePreview | null;
  fileName: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const emailValid = !email.trim() || EMAIL.test(email.trim());
  const hasRowEmail = preview?.lines.some((l) => l.email) ?? false;
  const blocked = !preview || Boolean(preview.rejection);

  // One order after the other: a failure stops the rest, so nothing is
  // charged that the partner was not told about.
  const pay = useMutation({
    mutationFn: async () => {
      const done: string[] = [];
      for (const order of preview!.orders) {
        const items = preview!.lines
          .filter((l) => (l.email ?? null) === order.email && l.planId)
          .map((l) => ({ planId: l.planId!, quantity: l.quantity }));
        const recipientEmail = order.email ?? (email.trim() || undefined);
        try {
          const result = await purchaseCart({
            items,
            ...(recipientEmail ? { recipientEmail } : {})
          });
          done.push(result.orderNumber);
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Thanh toán thất bại.';
          throw new Error(
            done.length
              ? `Đã đặt ${done.join(', ')}; đơn ${order.email ?? 'không email'} lỗi: ${message}`
              : message,
            { cause: e }
          );
        }
      }
      return done;
    },
    onSuccess: (orders) => {
      toast.success(`Đã đặt ${orders.length} đơn: ${orders.join(', ')}.`);
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => queryClient.invalidateQueries({ queryKey: partnerPortalKeys.all })
  });

  return (
    <Dialog open={Boolean(preview)} onOpenChange={(o) => !o && !pay.isPending && onClose()}>
      <DialogContent className='sm:max-w-[760px]' data-testid='cart-file-dialog'>
        <DialogHeader>
          <DialogTitle>Đặt nhiều eSIM từ file</DialogTitle>
          <DialogDescription>
            {fileName} — kiểm tra gói, số lượng và giá trước khi trừ ví ký quỹ.
          </DialogDescription>
        </DialogHeader>

        {preview && (
          <div className='max-h-[60vh] space-y-4 overflow-y-auto'>
            <ul className='divide-y rounded-lg border' data-testid='cart-file-lines'>
              {preview.lines.map((line) => (
                <li key={line.row} className='flex flex-wrap items-center gap-x-3 gap-y-1 p-3'>
                  <span className='text-muted-foreground w-14 text-xs'>Dòng {line.row}</span>
                  <div className='min-w-0 flex-1 basis-48'>
                    <p className='truncate text-sm font-medium'>{line.name ?? line.slug}</p>
                    <p className='text-muted-foreground truncate text-xs'>
                      {line.slug}
                      {line.email ? ` · QR: ${line.email}` : ''}
                    </p>
                    {line.error && <p className='text-destructive text-xs'>{line.error}</p>}
                  </div>
                  <span className='text-sm tabular-nums'>× {line.quantity}</span>
                  <span className='w-28 text-right text-sm font-medium tabular-nums'>
                    {line.error ? '—' : formatVnd(line.totalVnd)}
                  </span>
                </li>
              ))}
            </ul>

            {preview.orders.length > 0 && (
              <div className='bg-muted/50 space-y-1 rounded-lg p-3 text-sm'>
                {preview.orders.map((order) => (
                  <div key={order.email ?? ''} className='flex justify-between gap-3'>
                    <span className='text-muted-foreground min-w-0 break-words'>
                      Đơn gửi QR tới {order.email ?? 'email bên dưới'} · {order.planCount} gói ·{' '}
                      {order.esimCount} eSIM
                    </span>
                    <span className='shrink-0 tabular-nums'>{formatVnd(order.totalVnd)}</span>
                  </div>
                ))}
                <div className='flex justify-between font-semibold'>
                  <span>Tổng trừ ví ({preview.orders.length} đơn)</span>
                  <span className='tabular-nums' data-testid='cart-file-total'>
                    {formatVnd(preview.totalVnd)}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Số dư sau khi mua</span>
                  <span className='tabular-nums'>
                    {formatVnd(Math.max(0, preview.balanceVnd - preview.totalVnd))}
                  </span>
                </div>
              </div>
            )}

            {preview.orders.some((o) => !o.email) && (
              <div className='space-y-2'>
                <Label htmlFor='cart-file-email'>
                  Email nhận mã QR cho các dòng không ghi email
                </Label>
                <Input
                  id='cart-file-email'
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
                    ? 'Để trống thì tải file Excel ở trang Đơn hàng.'
                    : 'Email không hợp lệ.'}
                </p>
              </div>
            )}

            {preview.rejection && (
              <p className='text-destructive text-sm' data-testid='cart-file-rejection'>
                {preview.rejection}
              </p>
            )}
          </div>
        )}

        <DialogFooter className='gap-2'>
          <Button variant='outline' onClick={onClose} disabled={pay.isPending}>
            Huỷ
          </Button>
          <Button
            variant='secondary'
            disabled={!preview || preview.errorCount > 0 || hasRowEmail || pay.isPending}
            title={hasRowEmail ? 'File có email nhận QR riêng từng dòng — hãy đặt trực tiếp' : ''}
            onClick={() => {
              for (const line of preview!.lines) {
                addToCart({
                  planId: line.planId!,
                  name: line.name ?? line.slug,
                  destinationName: line.destinationName,
                  unitPriceVnd: line.unitPriceVnd,
                  quantity: line.quantity
                });
              }
              toast.success(`Đã thêm ${preview!.lines.length} dòng vào giỏ hàng.`);
              onClose();
            }}
          >
            Thêm vào giỏ hàng
          </Button>
          <Button
            disabled={blocked || !emailValid}
            isLoading={pay.isPending}
            onClick={() => pay.mutate()}
            data-testid='cart-file-pay'
          >
            {`Xác nhận đặt ${preview?.orders.length ?? 0} đơn, trừ ${formatVnd(preview?.totalVnd ?? 0)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PortalCartFileImport() {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<CartFilePreview | null>(null);
  const [fileName, setFileName] = useState('');

  const read = useMutation({
    mutationFn: previewCartFile,
    onSuccess: setPreview,
    onError: (e: Error) => toast.error(e.message)
  });

  return (
    <>
      <Button asChild size='sm' variant='outline'>
        <a href={CART_FILE_TEMPLATE_URL} data-testid='cart-file-template'>
          <Icons.download className='size-4' />
          File mẫu đặt nhiều eSIM
        </a>
      </Button>
      <Button
        size='sm'
        variant='outline'
        isLoading={read.isPending}
        onClick={() => input.current?.click()}
      >
        <Icons.upload className='size-4' />
        Nhập từ file
      </Button>
      <input
        ref={input}
        type='file'
        accept='.xlsx,.csv'
        className='hidden'
        data-testid='cart-file-input'
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          setFileName(file.name);
          read.mutate(file);
        }}
      />
      <FilePreviewDialog preview={preview} fileName={fileName} onClose={() => setPreview(null)} />
    </>
  );
}
