'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { formatVnd } from '@/lib/format';
import { ApiError } from '@/lib/api-client';
import {
  adminManualTopupMutation,
  topupPackagesQueryOptions,
  type TopupPackage
} from '../api/topup';

interface AdminTopupDialogProps {
  iccid: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Calls and SMS a package includes, read off its name — the API has no field
 * of its own for them, and a package with none says nothing about either:
 * "3 GB - 100 SMS - 100 Mins - 30 Days" → "100 phút · 100 SMS".
 */
export function callSmsLabel(name: string): string | null {
  const mins = /(\d+)\s*(?:mins?|minutes?|phút)\b/i.exec(name)?.[1];
  const sms = /(\d+)\s*sms\b/i.exec(name)?.[1];
  const parts = [mins && `${mins} phút`, sms && `${sms} SMS`].filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}

/**
 * A package the way the customer's own top-up screen shows it (vande #063):
 * labels for data (or unlimited), calls & SMS and days, the name below.
 */
function PackageCard({
  pkg,
  active,
  onSelect
}: {
  pkg: TopupPackage;
  active: boolean;
  onSelect: () => void;
}) {
  const callSms = callSmsLabel(pkg.name ?? '');
  return (
    <button
      type='button'
      onClick={onSelect}
      data-testid={`admin-topup-package-${pkg.packageId}`}
      className={`flex w-full items-start justify-between gap-3 rounded-lg border p-3 text-left transition-colors ${
        active ? 'border-primary bg-primary/5 ring-primary/20 ring-2' : 'hover:bg-muted/50'
      }`}
    >
      <div className='min-w-0 flex-1 space-y-1.5'>
        <div className='flex flex-wrap items-center gap-1.5'>
          {pkg.isUnlimited ? (
            <span className='inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'>
              <Icons.infinity className='size-3' />
              Không giới hạn
            </span>
          ) : (
            pkg.dataAmountText && (
              <span className='inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300'>
                <Icons.wifi className='size-3' />
                {pkg.dataAmountText}
              </span>
            )
          )}
          {callSms && (
            <span className='inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300'>
              <Icons.phone className='size-3' />
              {callSms}
            </span>
          )}
          {!!pkg.durationDays && (
            <span className='inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'>
              <Icons.calendar className='size-3' />
              {pkg.durationDays} ngày
            </span>
          )}
        </div>
        <p className='text-sm leading-snug'>{pkg.name || pkg.packageId}</p>
      </div>
      <span className='shrink-0 font-mono text-sm font-medium'>
        {pkg.vndPrice ? formatVnd(pkg.vndPrice) : `$${pkg.retailPrice}`}
      </span>
    </button>
  );
}

/**
 * Apply a topup for a customer without charging through a payment gateway.
 *
 * The package list comes from the same endpoint the storefront uses, so an
 * admin can only pick something the provider will actually accept — and a
 * provider that cannot be recharged at all simply returns nothing.
 */
export function AdminTopupDialog({ iccid, open, onOpenChange }: AdminTopupDialogProps) {
  const [selected, setSelected] = useState<TopupPackage | null>(null);
  const [note, setNote] = useState('');

  const { data, isLoading, error } = useQuery(topupPackagesQueryOptions(iccid, open));

  const mutation = useMutation({
    ...adminManualTopupMutation,
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`Đã nạp thành công cho eSIM. Mã đơn ${result.orderNumber}.`);
        onOpenChange(false);
        setSelected(null);
        setNote('');
      } else {
        // The order exists and is marked paid, but the provider did not apply
        // the topup — say so instead of showing a green tick.
        toast.error(
          `Đơn ${result.orderNumber} đã tạo nhưng nhà cung cấp CHƯA nạp được (${result.status}). Vào Quản lý đơn hàng để xử lý.`
        );
      }
    },
    onError: (e) => toast.error(e.message || 'Nạp không thành công')
  });

  const packages = data?.packages ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Topup hộ khách</DialogTitle>
          <DialogDescription>
            Nạp thêm dung lượng cho eSIM <span className='font-mono'>{iccid}</span> mà KHÔNG qua
            cổng thanh toán.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <Icons.info className='h-4 w-4' />
          <AlertDescription>
            Đơn được ghi cho chính chủ eSIM và đánh dấu đã thanh toán bằng &quot;ADMIN_MANUAL&quot;,
            kèm tên admin thực hiện — dùng khi khách đã trả tiền bằng cách khác. Hệ thống KHÔNG thu
            thêm tiền của khách.
          </AlertDescription>
        </Alert>

        {isLoading ? (
          <p className='text-muted-foreground py-6 text-center text-sm'>Đang tải gói nạp…</p>
        ) : error instanceof ApiError && error.status === 400 ? (
          // The backend refuses suppliers with no recharge at all (Viettel /
          // local inventory) with an English 400 — say it in the admin's words.
          <p className='text-muted-foreground py-6 text-center text-sm'>
            Nhà cung cấp của eSIM này không hỗ trợ nạp thêm.
          </p>
        ) : error ? (
          <p className='text-destructive py-6 text-center text-sm'>
            Không tải được danh sách gói: {error.message}
          </p>
        ) : packages.length === 0 ? (
          <p className='text-muted-foreground py-6 text-center text-sm'>
            Nhà cung cấp của eSIM này không hỗ trợ nạp thêm, hoặc hiện không có gói nào khả dụng.
          </p>
        ) : (
          <div className='max-h-[40vh] space-y-2 overflow-auto'>
            {packages.map((pkg) => (
              <PackageCard
                key={pkg.packageId}
                pkg={pkg}
                active={selected?.packageId === pkg.packageId}
                onSelect={() => setSelected(pkg)}
              />
            ))}
          </div>
        )}

        <div className='space-y-2'>
          <Label htmlFor='admin-topup-note'>Lý do / ghi chú</Label>
          <Input
            id='admin-topup-note'
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder='VD: Khách chuyển khoản trực tiếp 12/09'
          />
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Huỷ
          </Button>
          <Button
            disabled={!selected || mutation.isPending}
            onClick={() =>
              selected &&
              mutation.mutate({
                iccid,
                packageId: selected.packageId,
                provider: data!.provider,
                note: note.trim() || undefined
              })
            }
          >
            {mutation.isPending && <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />}
            Xác nhận nạp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
