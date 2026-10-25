'use client';

/**
 * "Đặt eSIM hàng loạt" (vande #057): a travel agency's list of travellers
 * and plans, up to 50 rows from a file, ordered in one go — either
 *
 * 1. mailed: one order per traveller's email, each QR code mailed a set
 *    number of seconds after the one before, so a group's emails are not
 *    sent back to back and marked as spam; or
 * 2. as a file: ONE order under the admin's account, nothing mailed, the
 *    eSIMs downloaded as a list from that order's page.
 */

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
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
import { cn } from '@/lib/utils';

import { BULK_ORDER_TEMPLATE_URL, previewBulkOrderFile, submitBulkOrder } from '../api/service';
import type { BulkOrderResult, ManualOrderFilePreview } from '../api/types';

const DEFAULT_INTERVAL = 30;

/** "12 phút 30 giây" — how long the last email waits. */
function duration(seconds: number): string {
  if (seconds < 60) return `${seconds} giây`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s ? `${m} phút ${s} giây` : `${m} phút`;
}

export function BulkOrderDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'email' | 'file'>('email');
  const [intervalText, setIntervalText] = useState(String(DEFAULT_INTERVAL));
  const [preview, setPreview] = useState<ManualOrderFilePreview | null>(null);
  const [result, setResult] = useState<BulkOrderResult | null>(null);

  const interval = Math.min(600, Math.max(0, Number(intervalText || 0)));
  const lines = preview?.lines ?? [];
  const bad = lines.filter((l) => l.error || (mode === 'email' && !l.email));
  const esimCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  const reset = () => {
    setPreview(null);
    setResult(null);
  };

  const read = useMutation({
    mutationFn: previewBulkOrderFile,
    onSuccess: (p) => {
      setResult(null);
      setPreview(p);
    },
    onError: (e: Error) => {
      setPreview(null);
      toast.error(e.message);
    }
  });

  const place = useMutation({
    mutationFn: () =>
      submitBulkOrder({
        mode,
        ...(mode === 'email' ? { emailIntervalSec: interval } : {}),
        rows: lines.map((l) => ({
          slug: l.slug,
          quantity: l.quantity,
          email: l.email ?? null
        }))
      }),
    onSuccess: (r) => {
      setResult(r);
      toast.success(
        r.mode === 'email'
          ? `Đã tạo ${r.orders.length} đơn, email mã QR đang được gửi lần lượt.`
          : `Đã tạo đơn ${r.orders[0]?.orderNumber} — tải danh sách eSIM ở trang chi tiết đơn.`
      );
    },
    onError: (e: Error) => toast.error(e.message || 'Không đặt được eSIM hàng loạt.')
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent
        className='max-h-[90vh] overflow-y-auto sm:max-w-3xl'
        data-testid='bulk-order-dialog'
      >
        <DialogHeader>
          <DialogTitle>Đặt eSIM hàng loạt</DialogTitle>
          <DialogDescription>
            Tối đa 50 dòng mỗi file: cột Mã gói cước, Số lượng và Email nhận QR. Đơn được thanh toán
            ngay như &quot;Đặt đơn hộ&quot;.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className='space-y-3' data-testid='bulk-order-result'>
            <p className='text-sm'>
              {result.mode === 'email'
                ? `Đã tạo ${result.orders.length} đơn. Email mã QR được gửi lần lượt, cách nhau ${interval} giây.`
                : 'Đã tạo 1 đơn, không gửi email. Bấm vào mã đơn để tải file danh sách eSIM.'}
            </p>
            <ul className='divide-y rounded-lg border text-sm'>
              {result.orders.map((o) => (
                <li key={o.orderNumber} className='flex flex-wrap justify-between gap-2 px-3 py-2'>
                  <Link
                    href={`/dashboard/orders/${o.id}`}
                    className='font-mono text-xs underline underline-offset-4'
                  >
                    {o.orderNumber}
                  </Link>
                  <span className='text-muted-foreground text-xs'>
                    {o.esims} eSIM · {o.email}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
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
                    'Không gửi email. Tạo 1 đơn theo email của bạn, tải file Excel có mã QR ở trang chi tiết đơn.'
                  ]
                ] as const
              ).map(([value, title, hint]) => (
                <button
                  key={value}
                  type='button'
                  onClick={() => setMode(value)}
                  aria-pressed={mode === value}
                  data-testid={`bulk-mode-${value}`}
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
                <Label htmlFor='bulkInterval'>Số giây giữa hai email</Label>
                <Input
                  id='bulkInterval'
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
                  {esimCount > 1 &&
                    ` ${esimCount} email sẽ gửi xong trong khoảng ${duration(interval * (esimCount - 1))}.`}
                </p>
              </div>
            )}

            <div className='flex flex-wrap items-center gap-2 rounded-lg border border-dashed p-3'>
              <span className='mr-auto text-sm font-medium'>File danh sách</span>
              <Button type='button' variant='outline' size='sm' asChild>
                <a href={BULK_ORDER_TEMPLATE_URL}>
                  <Icons.download className='mr-2 h-4 w-4' />
                  Tải file mẫu
                </a>
              </Button>
              <Button
                type='button'
                size='sm'
                variant='secondary'
                isLoading={read.isPending}
                onClick={() => input.current?.click()}
              >
                <Icons.upload className='mr-2 h-4 w-4' />
                Chọn file
              </Button>
              <input
                ref={input}
                type='file'
                accept='.xlsx,.csv'
                className='hidden'
                data-testid='bulk-order-file-input'
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) read.mutate(file);
                }}
              />
            </div>

            {bad.length > 0 && (
              <Alert variant='destructive'>
                <Icons.warning className='h-4 w-4' />
                <AlertTitle>Sửa các dòng sau rồi chọn lại file</AlertTitle>
                <AlertDescription>
                  <ul className='list-disc space-y-1 pl-4 text-xs'>
                    {bad.map((l) => (
                      <li key={l.row}>
                        Dòng {l.row}
                        {l.slug ? ` (${l.slug})` : ''}: {l.error ?? 'thiếu Email nhận QR.'}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {lines.length > 0 && (
              <div className='overflow-x-auto rounded-lg border' data-testid='bulk-order-preview'>
                <table className='w-full text-xs'>
                  <thead className='bg-muted'>
                    <tr className='text-left'>
                      <th className='px-2 py-1.5'>Dòng</th>
                      <th className='px-2 py-1.5'>Gói</th>
                      <th className='px-2 py-1.5 text-right'>SL</th>
                      <th className='px-2 py-1.5'>Email nhận QR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l) => (
                      <tr key={l.row} className='border-t'>
                        <td className='px-2 py-1.5'>{l.row}</td>
                        <td className='px-2 py-1.5'>{l.plan?.label ?? l.slug}</td>
                        <td className='px-2 py-1.5 text-right tabular-nums'>{l.quantity}</td>
                        <td className='px-2 py-1.5'>
                          {l.email ?? (mode === 'file' ? '—' : 'Thiếu')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {result ? (
            <Button onClick={reset}>Đặt tiếp file khác</Button>
          ) : (
            <Button
              onClick={() => place.mutate()}
              disabled={!lines.length || bad.length > 0}
              isLoading={place.isPending}
              data-testid='bulk-order-submit'
            >
              {mode === 'email'
                ? `Đặt ${esimCount} eSIM và gửi email`
                : `Đặt ${esimCount} eSIM và xuất file`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
