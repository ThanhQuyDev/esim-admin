'use client';

import { useState } from 'react';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { formatDate } from '@/lib/format';
import { PROVIDER_LABELS } from '@/features/overview/api/constants';
import { providerSalesStatusesQueryOptions } from '../api/queries';
import { setProviderSalesStatusMutation } from '../api/mutations';
import type { ProviderSalesStatus } from '../api/types';

function StatusRow({ row }: { row: ProviderSalesStatus }) {
  const label = PROVIDER_LABELS[row.provider] ?? row.provider;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState('');

  const mutation = useMutation({
    ...setProviderSalesStatusMutation,
    onSuccess: (res) =>
      toast.success(
        res.data.isEnabled
          ? `Đã bật bán lại ${label}. ${res.data.activePlanCount.toLocaleString('vi-VN')} gói đang hoạt động.`
          : `Đã tạm ngưng bán ${label}. ${res.data.disabledPlanCount.toLocaleString('vi-VN')} gói đã chuyển sang Không hoạt động.`
      ),
    onError: (error) => toast.error(error.message || 'Cập nhật trạng thái thất bại')
  });

  /** Switching off hides plans from the storefront, so it is confirmed first. */
  const onToggle = (next: boolean) => {
    if (!next) {
      setReason('');
      setConfirmOpen(true);
      return;
    }
    mutation.mutate({ provider: row.provider, values: { isEnabled: true } });
  };

  const confirmDisable = () => {
    setConfirmOpen(false);
    mutation.mutate({
      provider: row.provider,
      values: { isEnabled: false, disabledReason: reason.trim() || null }
    });
  };

  return (
    <>
      <TableRow data-testid={`provider-status-row-${row.provider}`}>
        <TableCell className='font-medium'>
          {label}
          <div className='text-muted-foreground text-xs'>{row.provider}</div>
        </TableCell>
        <TableCell>
          {row.isEnabled ? (
            <Badge variant='default'>Đang bán</Badge>
          ) : (
            <Badge variant='destructive'>Tạm ngưng</Badge>
          )}
        </TableCell>
        <TableCell className='text-right font-mono'>
          {row.activePlanCount.toLocaleString('vi-VN')}
        </TableCell>
        <TableCell className='text-right font-mono'>
          {row.disabledPlanCount > 0 ? row.disabledPlanCount.toLocaleString('vi-VN') : '—'}
        </TableCell>
        <TableCell className='text-muted-foreground max-w-64 text-sm'>
          {row.disabledReason || '—'}
        </TableCell>
        <TableCell className='text-muted-foreground text-sm whitespace-nowrap'>
          {row.disabledAt ? formatDate(row.disabledAt) : '—'}
        </TableCell>
        <TableCell className='text-right'>
          <Switch
            checked={row.isEnabled}
            disabled={mutation.isPending}
            onCheckedChange={onToggle}
            aria-label={`Bật/tắt bán ${label}`}
            data-testid={`provider-status-switch-${row.provider}`}
          />
        </TableCell>
      </TableRow>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tạm ngưng bán {label}?</AlertDialogTitle>
            <AlertDialogDescription>
              {row.activePlanCount.toLocaleString('vi-VN')} gói eSIM của nhà cung cấp này sẽ chuyển
              sang trạng thái <strong>Không hoạt động</strong> và biến mất khỏi trang sản phẩm ngoài
              web. Khi bật lại, hệ thống chỉ mở đúng những gói bị tắt bởi thao tác này — gói nào anh
              đã tự tắt trước đó vẫn giữ nguyên trạng thái tắt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='space-y-2'>
            <Label htmlFor={`disable-reason-${row.provider}`}>Lý do (không bắt buộc)</Label>
            <Textarea
              id={`disable-reason-${row.provider}`}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder='VD: API nhà cung cấp lỗi, đang chờ xử lý'
              maxLength={500}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisable}>Tạm ngưng bán</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/**
 * Switch a whole supplier on or off (#005) — the fast way to stop selling when a
 * supplier breaks, instead of deactivating a thousand plans one by one.
 */
export function ProviderSalesStatusTable() {
  const { data } = useSuspenseQuery(providerSalesStatusesQueryOptions());
  const rows = data.data;
  const disabledCount = rows.filter((row) => !row.isEnabled).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bật / tắt nhà cung cấp</CardTitle>
        <CardDescription>
          Tắt một nhà cung cấp là toàn bộ gói eSIM của họ chuyển sang{' '}
          <strong>Không hoạt động</strong>, tức ẩn hết khỏi trang sản phẩm ngoài web — dùng khi nhà
          cung cấp gặp sự cố đột xuất và cần tạm ngưng bán ngay. Bật lại thì chỉ những gói bị tắt
          bởi thao tác này được mở lại.
          {disabledCount > 0 ? (
            <>
              {' '}
              Hiện có <strong>{disabledCount}</strong> nhà cung cấp đang tạm ngưng.
            </>
          ) : null}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nhà cung cấp</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className='text-right'>Gói đang bán</TableHead>
                <TableHead className='text-right'>Gói bị tắt</TableHead>
                <TableHead>Lý do tạm ngưng</TableHead>
                <TableHead>Tắt lúc</TableHead>
                <TableHead className='text-right'>Bật/tắt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className='text-muted-foreground py-10 text-center'>
                    Chưa có nhà cung cấp nào.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => <StatusRow key={row.provider} row={row} />)
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProviderSalesStatusTableSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4'>
      <div className='bg-muted h-10 w-full rounded' />
      <div className='bg-muted h-96 w-full rounded-lg' />
    </div>
  );
}
