'use client';

/**
 * "Đặt eSIM hàng loạt" beside the cart (doitac-1410 #084, doitac-3010 #025):
 * many eSIMs at once from a spreadsheet — the price list export with a "Số
 * lượng" column filled in, or the template. It reads like the admin's own
 * "Đặt eSIM hàng loạt" on the Orders page: pick how the eSIMs are handed over,
 * download the template or choose the file in the same window, check the
 * rows, then confirm. The file is priced by the server first; rows with an
 * "Email nhận QR" become one order per email, the other rows one order whose
 * QR codes go to the email typed here (or none, then the Excel file on the
 * Orders page). Each order is paid through the cart checkout, as before.
 *
 * Two ways to take a travel group's list (vande #057): mail each traveller
 * their QR codes, one email every few seconds so they are not sent back to
 * back and marked as spam; or ONE order with nothing mailed, the eSIMs
 * downloaded as a list from the Orders page.
 */

import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { cn } from '@/lib/utils';

import { partnerPortalKeys } from '../api/queries';
import { CART_FILE_TEMPLATE_URL, previewCartFile, purchaseCart } from '../api/service';
import type { CartFilePreview } from '../api/types';
import { addToCart } from '../lib/partner-cart';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Seconds between two QR emails unless the partner sets otherwise (vande #057). */
const DEFAULT_INTERVAL = 30;

/** One id for every checkout of an upload, so their emails queue together. */
function newBatchId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function BulkOrderDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<CartFilePreview | null>(null);
  const [fileName, setFileName] = useState('');
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState<'email' | 'file'>('email');
  const [intervalText, setIntervalText] = useState(String(DEFAULT_INTERVAL));
  const interval = Math.min(600, Math.max(0, Number(intervalText || 0)));
  const emailValid = mode === 'file' || !email.trim() || EMAIL.test(email.trim());
  const hasRowEmail = preview?.lines.some((l) => l.email) ?? false;
  const blocked = !preview || Boolean(preview.rejection);
  const badLines = preview?.lines.filter((l) => l.error) ?? [];

  const reset = () => {
    setPreview(null);
    setFileName('');
    setEmail('');
  };

  const read = useMutation({
    mutationFn: previewCartFile,
    onSuccess: setPreview,
    onError: (e: Error) => {
      setPreview(null);
      toast.error(e.message);
    }
  });

  // One order after the other: a failure stops the rest, so nothing is
  // charged that the partner was not told about.
  const pay = useMutation({
    mutationFn: async () => {
      const done: string[] = [];
      // As a file: one order for every row, nothing mailed (vande #057).
      if (mode === 'file') {
        const result = await purchaseCart({
          items: preview!.lines
            .filter((l) => l.planId)
            .map((l) => ({ planId: l.planId!, quantity: l.quantity })),
          bulkMode: 'file',
          bulkBatch: newBatchId()
        });
        return [result.orderNumber];
      }
      const batch = newBatchId();
      for (const order of preview!.orders) {
        const items = preview!.lines
          .filter((l) => (l.email ?? null) === order.email && l.planId)
          .map((l) => ({ planId: l.planId!, quantity: l.quantity }));
        const recipientEmail = order.email ?? (email.trim() || undefined);
        try {
          const result = await purchaseCart({
            items,
            ...(recipientEmail ? { recipientEmail } : {}),
            bulkMode: 'email',
            bulkBatch: batch,
            emailIntervalSec: interval
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
      toast.success(
        mode === 'file'
          ? `Đã đặt đơn ${orders[0]} — tải danh sách eSIM ở trang Đơn hàng.`
          : `Đã đặt ${orders.length} đơn: ${orders.join(', ')}. Email mã QR đang được gửi lần lượt.`
      );
      reset();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => queryClient.invalidateQueries({ queryKey: partnerPortalKeys.all })
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pay.isPending) return;
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent
        className='max-h-[90vh] overflow-y-auto sm:max-w-3xl'
        data-testid='cart-file-dialog'
      >
        <DialogHeader>
          <DialogTitle>Đặt eSIM hàng loạt</DialogTitle>
          <DialogDescription>
            File gồm cột Mã gói cước, Số lượng và Email nhận QR (có thể dùng file Xuất bảng giá điền
            thêm cột Số lượng). Hệ thống báo giá từng dòng trước khi trừ ví ký quỹ.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='grid gap-2 sm:grid-cols-2'>
            {(
              [
                [
                  'email',
                  'Gửi email mã QR cho từng khách',
                  'Mỗi email trong file một đơn; email gửi lần lượt, cách nhau số giây bên dưới.'
                ],
                [
                  'file',
                  'Xuất file danh sách eSIM',
                  'Không gửi email. Gộp thành 1 đơn, tải file Excel có mã QR ở trang Đơn hàng.'
                ]
              ] as const
            ).map(([value, title, hint]) => (
              <button
                key={value}
                type='button'
                onClick={() => setMode(value)}
                aria-pressed={mode === value}
                data-testid={`cart-file-mode-${value}`}
                className={cn(
                  'rounded-lg border p-3 text-left text-sm transition-colors',
                  mode === value ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                )}
              >
                <span className='font-medium'>{title}</span>
                <span className='text-muted-foreground mt-1 block text-xs'>{hint}</span>
              </button>
            ))}
          </div>

          {mode === 'email' && (
            <div className='space-y-1'>
              <Label htmlFor='cart-file-interval'>Số giây giữa hai email</Label>
              <Input
                id='cart-file-interval'
                type='number'
                min={0}
                max={600}
                className='w-32'
                value={intervalText}
                onChange={(e) => setIntervalText(e.target.value)}
              />
              <p className='text-muted-foreground text-xs'>
                Mặc định 30 giây. Ít dòng có thể gửi nhanh hơn, nhiều dòng nên để lâu hơn để email
                không bị tính là spam.
              </p>
            </div>
          )}

          <div className='flex flex-wrap items-center gap-2 rounded-lg border border-dashed p-3'>
            <span className='mr-auto min-w-0 text-sm font-medium'>
              File danh sách
              {fileName && (
                <span className='text-muted-foreground ml-2 font-normal break-all'>{fileName}</span>
              )}
            </span>
            <Button type='button' variant='outline' size='sm' asChild>
              <a href={CART_FILE_TEMPLATE_URL} data-testid='cart-file-template'>
                <Icons.download className='size-4' />
                Tải file mẫu
              </a>
            </Button>
            <Button
              type='button'
              size='sm'
              variant='secondary'
              isLoading={read.isPending}
              onClick={() => input.current?.click()}
              data-testid='cart-file-choose'
            >
              <Icons.upload className='size-4' />
              {preview ? 'Chọn file khác' : 'Chọn file'}
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
          </div>

          {badLines.length > 0 && (
            <Alert variant='destructive'>
              <Icons.warning className='size-4' />
              <AlertTitle>Sửa các dòng sau rồi chọn lại file</AlertTitle>
              <AlertDescription>
                <ul className='list-disc space-y-1 pl-4 text-xs'>
                  {badLines.map((l) => (
                    <li key={l.row}>
                      Dòng {l.row}
                      {l.slug ? ` (${l.slug})` : ''}: {l.error}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {preview && (
            <>
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
                  {mode === 'email' &&
                    preview.orders.map((order) => (
                      <div key={order.email ?? ''} className='flex justify-between gap-3'>
                        <span className='text-muted-foreground min-w-0 break-words'>
                          Đơn gửi QR tới {order.email ?? 'email bên dưới'} · {order.planCount} gói ·{' '}
                          {order.esimCount} eSIM
                        </span>
                        <span className='shrink-0 tabular-nums'>{formatVnd(order.totalVnd)}</span>
                      </div>
                    ))}
                  <div className='flex justify-between font-semibold'>
                    <span>Tổng trừ ví ({mode === 'file' ? 1 : preview.orders.length} đơn)</span>
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

              {mode === 'email' && preview.orders.some((o) => !o.email) && (
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
            </>
          )}
        </div>

        <DialogFooter className='gap-2'>
          <Button
            variant='outline'
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
            disabled={pay.isPending}
          >
            Huỷ
          </Button>
          {preview && (
            <Button
              variant='secondary'
              disabled={preview.errorCount > 0 || hasRowEmail || pay.isPending}
              title={hasRowEmail ? 'File có email nhận QR riêng từng dòng — hãy đặt trực tiếp' : ''}
              onClick={() => {
                for (const line of preview.lines) {
                  addToCart({
                    planId: line.planId!,
                    name: line.name ?? line.slug,
                    destinationName: line.destinationName,
                    unitPriceVnd: line.unitPriceVnd,
                    quantity: line.quantity
                  });
                }
                toast.success(`Đã thêm ${preview.lines.length} dòng vào giỏ hàng.`);
                reset();
                onOpenChange(false);
              }}
            >
              Thêm vào giỏ hàng
            </Button>
          )}
          <Button
            disabled={blocked || !emailValid}
            isLoading={pay.isPending}
            onClick={() => pay.mutate()}
            data-testid='cart-file-pay'
          >
            {preview
              ? `Xác nhận đặt ${mode === 'file' ? 1 : preview.orders.length} đơn, trừ ${formatVnd(preview.totalVnd)}`
              : 'Chọn file để đặt'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PortalCartFileImport() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size='sm' variant='outline' onClick={() => setOpen(true)} data-testid='bulk-order'>
        <Icons.upload className='size-4' />
        Đặt eSIM hàng loạt
      </Button>
      <BulkOrderDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
