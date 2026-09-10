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

function packageLabel(pkg: TopupPackage): string {
  const parts = [pkg.title || pkg.packageId];
  if (pkg.data) parts.push(pkg.data);
  if (pkg.day) parts.push(`${pkg.day} ngày`);
  return parts.join(' · ');
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
            {packages.map((pkg) => {
              const isActive = selected?.packageId === pkg.packageId;
              return (
                <button
                  key={pkg.packageId}
                  type='button'
                  onClick={() => setSelected(pkg)}
                  className={`flex w-full items-center justify-between rounded-md border p-3 text-left transition-colors ${
                    isActive ? 'border-primary bg-muted' : 'hover:bg-muted/50'
                  }`}
                >
                  <span className='text-sm'>{packageLabel(pkg)}</span>
                  <span className='font-mono text-sm'>
                    {pkg.vndPrice ? formatVnd(pkg.vndPrice) : `$${pkg.retailPrice}`}
                  </span>
                </button>
              );
            })}
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
