'use client';

import { useState } from 'react';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { providerSurchargesQueryOptions } from '../api/queries';
import { saveProviderSurchargeMutation } from '../api/mutations';
import type { ProviderSurcharge } from '../api/types';
import { parseSurchargePercent, surchargedAmount } from '../utils/percent';

function SurchargeRow({ row }: { row: ProviderSurcharge }) {
  const label = PROVIDER_LABELS[row.provider] ?? row.provider;
  const [percentText, setPercentText] = useState(row.percentage ? String(row.percentage) : '');
  const [note, setNote] = useState(row.note ?? '');

  const percentage = parseSurchargePercent(percentText);
  const invalid = percentage === null;
  const dirty = !invalid && (percentage !== row.percentage || note.trim() !== (row.note ?? ''));

  const mutation = useMutation({
    ...saveProviderSurchargeMutation,
    onSuccess: (res) =>
      toast.success(`Đã lưu thuế phí ${label}: ${res.data.percentage}%. Đã tính lại gói rẻ nhất.`),
    onError: (error) => toast.error(error.message || 'Lưu thuế phí thất bại')
  });

  const save = () => {
    if (percentage === null) return;
    mutation.mutate({
      provider: row.provider,
      values: { percentage, note: note.trim() || null }
    });
  };

  return (
    <TableRow data-testid={`surcharge-row-${row.provider}`}>
      <TableCell className='font-medium'>
        {label}
        <div className='text-muted-foreground text-xs'>{row.provider}</div>
      </TableCell>
      <TableCell className='text-right font-mono'>
        {row.activePlanCount.toLocaleString('vi-VN')}
      </TableCell>
      <TableCell>
        <div className='flex items-center gap-2'>
          <Input
            inputMode='decimal'
            value={percentText}
            onChange={(event) => setPercentText(event.target.value)}
            placeholder='0'
            className='h-8 w-24 text-right'
            aria-label={`Thuế phí ${label} (%)`}
            aria-invalid={invalid}
          />
          <span className='text-muted-foreground text-sm'>%</span>
        </div>
        {invalid ? (
          <p className='text-destructive mt-1 text-xs'>Nhập số từ 0 đến 100, tối đa 2 số lẻ.</p>
        ) : percentage ? (
          <p className='text-muted-foreground mt-1 text-xs'>
            VD: giá vốn 10 USD được so như {surchargedAmount(10, percentage).toFixed(2)} USD
          </p>
        ) : null}
      </TableCell>
      <TableCell>
        <Input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder='VD: VAT 10% trên hoá đơn'
          maxLength={500}
          className='h-8 min-w-48'
          aria-label={`Ghi chú thuế phí ${label}`}
        />
      </TableCell>
      <TableCell className='text-muted-foreground text-sm whitespace-nowrap'>
        {row.updatedAt ? formatDate(row.updatedAt) : '—'}
      </TableCell>
      <TableCell className='text-right'>
        <Button
          size='sm'
          onClick={save}
          disabled={!dirty || mutation.isPending}
          isLoading={mutation.isPending}
        >
          Lưu
        </Button>
      </TableCell>
    </TableRow>
  );
}

/**
 * Tax / fee per supplier, used when the cheapest plan is picked (#049).
 */
export function ProviderSurchargesTable() {
  const { data } = useSuspenseQuery(providerSurchargesQueryOptions());
  const rows = data.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thuế phí theo nhà cung cấp</CardTitle>
        <CardDescription>
          Phần trăm này được cộng vào giá vốn của nhà cung cấp <strong>khi so sánh giá</strong> để
          chọn gói rẻ nhất cho cùng quốc gia/khu vực, dung lượng và số ngày. Giá bán cho khách vẫn
          tính theo Profit Margin, không đổi. Bấm Lưu là hệ thống tính lại gói rẻ nhất ngay.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nhà cung cấp</TableHead>
                <TableHead className='text-right'>Gói đang bán</TableHead>
                <TableHead>Thuế phí</TableHead>
                <TableHead>Ghi chú</TableHead>
                <TableHead>Cập nhật</TableHead>
                <TableHead className='text-right'>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-muted-foreground py-10 text-center'>
                    Chưa có nhà cung cấp nào.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  // Remount after a save so the inputs start from the saved values.
                  <SurchargeRow key={`${row.provider}-${row.updatedAt ?? 'new'}`} row={row} />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProviderSurchargesTableSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4'>
      <div className='bg-muted h-10 w-full rounded' />
      <div className='bg-muted h-96 w-full rounded-lg' />
    </div>
  );
}
