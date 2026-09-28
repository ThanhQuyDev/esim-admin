'use client';

/**
 * The monthly reconciliation statement, one row per partner (#065, #066).
 *
 * The commission list next door is a row per order, which is the wrong grain
 * for a sign-off: an admin approves "tháng 9 của đối tác A", not four hundred
 * commissions one at a time. Everything except the status and the note is
 * worked out from the commissions on every load, so a refund the day after an
 * approval shows up here rather than sitting in a stale copy.
 */

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import { formatVnd } from '@/lib/format';

import { setReconciliationStatusMutation } from '../api/mutations';
import { reconciliationsQueryOptions } from '../api/queries';
import type { ReconciliationRow } from '../api/types';

/** The three states a statement moves through, in the brief's own order. */
const STATUSES = [
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'reviewing', label: 'Đang kiểm tra' },
  { value: 'approved', label: 'Đã duyệt' }
] as const;

const STATUS_LABEL: Record<string, string> = Object.fromEntries(
  STATUSES.map((s) => [s.value, s.label])
);
const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  pending: 'secondary',
  reviewing: 'outline',
  approved: 'default'
};

const NOTE_LIMIT = 1000;

/** The current month and the eleven before it, newest first. */
function recentPeriods(): { value: string; label: string }[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return { value: `${d.getFullYear()}-${month}`, label: `Tháng ${month}/${d.getFullYear()}` };
  });
}

const periodLabel = (period: string) => {
  const [year, month] = period.split('-');
  return `Tháng ${month}/${year}`;
};

export function ReconciliationsView() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [period, setPeriod] = useState(() => recentPeriods()[0].value);
  const [selected, setSelected] = useState<number[]>([]);
  const [detailOf, setDetailOf] = useState<ReconciliationRow | null>(null);

  const queryClient = useQueryClient();
  const params = useMemo(
    () => ({
      period,
      ...(search.trim() && { search: search.trim() }),
      ...(status !== 'all' && { status })
    }),
    [period, search, status]
  );

  const { data, isLoading } = useQuery(reconciliationsQueryOptions(params));
  const rows = data?.rows ?? [];

  const setStatusMutation = useMutation({
    ...setReconciliationStatusMutation,
    onSuccess: (result) => {
      toast.success(`Đã cập nhật ${result.updated} kỳ đối soát`);
      setSelected([]);
      setDetailOf(null);
    },
    onError: (error: Error) => toast.error(error.message || 'Không cập nhật được trạng thái'),
    onSettled: () => queryClient.invalidateQueries()
  });

  const apply = (partnerIds: number[], next: string, note?: string) =>
    setStatusMutation.mutate({
      partnerIds,
      period,
      status: next,
      ...(note !== undefined && { note })
    });

  const allTicked = rows.length > 0 && selected.length === rows.length;
  const toggleAll = () => setSelected(allTicked ? [] : rows.map((r) => r.partnerId));
  const toggleOne = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <Input
          placeholder='Tìm tên, email, SĐT hoặc ID đối tác'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='max-w-[280px]'
        />
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Kỳ đối soát' />
          </SelectTrigger>
          <SelectContent>
            {recentPeriods().map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className='w-[180px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Tất cả trạng thái</SelectItem>
            {STATUSES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant='outline'
          className='ml-auto'
          onClick={() => {
            const query = new URLSearchParams(params as Record<string, string>).toString();
            window.location.href = `/api/partners/reconciliations/export-excel?${query}`;
          }}
        >
          <Icons.download className='mr-2 h-4 w-4' />
          Xuất file đối soát
        </Button>
      </div>

      {selected.length > 0 && (
        <div className='bg-muted/50 flex flex-wrap items-center gap-2 rounded-lg border p-3'>
          <span className='text-sm font-medium'>Đã chọn {selected.length} đối tác</span>
          <span className='text-muted-foreground text-sm'>· đổi trạng thái thành</span>
          {STATUSES.map((option) => (
            <Button
              key={option.value}
              size='sm'
              variant='outline'
              disabled={setStatusMutation.isPending}
              onClick={() => apply(selected, option.value)}
            >
              {option.label}
            </Button>
          ))}
          <Button size='sm' variant='ghost' onClick={() => setSelected([])}>
            Bỏ chọn
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className='flex justify-center py-12'>
          <Icons.spinner className='h-6 w-6 animate-spin' />
        </div>
      ) : rows.length === 0 ? (
        <p className='text-muted-foreground py-12 text-center text-sm'>
          Kỳ {periodLabel(period)} chưa có hoa hồng nào để đối soát.
        </p>
      ) : (
        <div className='rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-10'>
                  <Checkbox
                    checked={allTicked}
                    onCheckedChange={toggleAll}
                    aria-label='Chọn tất cả'
                  />
                </TableHead>
                <TableHead>Đối tác</TableHead>
                <TableHead>Kỳ đối soát</TableHead>
                <TableHead className='text-right'>Số đơn hợp lệ</TableHead>
                <TableHead className='text-right'>Tổng eSIM bán</TableHead>
                <TableHead className='text-right'>% qua mã</TableHead>
                <TableHead className='text-right'>Tổng doanh số</TableHead>
                <TableHead className='text-right'>Tổng hoa hồng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className='text-right'>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.partnerId}>
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(row.partnerId)}
                      onCheckedChange={() => toggleOne(row.partnerId)}
                      aria-label={`Chọn đối tác #${row.partnerId}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className='font-medium'>
                      {row.contactName ?? `Đối tác #${row.partnerId}`}
                    </div>
                    <div className='text-muted-foreground text-xs'>
                      #{row.partnerId} · {row.contactEmail ?? '—'}
                    </div>
                  </TableCell>
                  <TableCell>{periodLabel(data?.period ?? period)}</TableCell>
                  <TableCell className='text-right tabular-nums'>{row.validOrders}</TableCell>
                  <TableCell className='text-right tabular-nums'>{row.esimsSold}</TableCell>
                  <TableCell className='text-right tabular-nums'>{row.viaCouponPercent}%</TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {formatVnd(row.revenueVnd)}
                  </TableCell>
                  <TableCell className='text-right font-medium tabular-nums'>
                    {formatVnd(row.commissionVnd)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[row.status] ?? 'secondary'}>
                      {STATUS_LABEL[row.status] ?? row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-right'>
                    <Button size='sm' variant='outline' onClick={() => setDetailOf(row)}>
                      Xem chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {detailOf && (
        <ReconciliationDetailDialog
          row={detailOf}
          period={data?.period ?? period}
          pending={setStatusMutation.isPending}
          onClose={() => setDetailOf(null)}
          onApply={(next, note) => apply([detailOf.partnerId], next, note)}
        />
      )}
    </div>
  );
}

/** "Chi tiết hoa hồng tiếp thị · <đối tác>" (#065). */
function ReconciliationDetailDialog({
  row,
  period,
  pending,
  onClose,
  onApply
}: {
  row: ReconciliationRow;
  period: string;
  pending: boolean;
  onClose: () => void;
  onApply: (status: string, note: string) => void;
}) {
  const [note, setNote] = useState(row.note ?? '');

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>
            Chi tiết hoa hồng tiếp thị · {row.contactName ?? `Đối tác #${row.partnerId}`}
          </DialogTitle>
        </DialogHeader>

        <dl className='grid grid-cols-2 gap-3 text-sm'>
          <div>
            <dt className='text-muted-foreground text-xs'>Kỳ đối soát</dt>
            <dd className='font-medium'>{periodLabel(period)}</dd>
          </div>
          <div>
            <dt className='text-muted-foreground text-xs'>Trạng thái</dt>
            <dd>
              <Badge variant={STATUS_VARIANT[row.status] ?? 'secondary'}>
                {STATUS_LABEL[row.status] ?? row.status}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className='text-muted-foreground text-xs'>Tổng hoa hồng</dt>
            <dd className='font-semibold tabular-nums'>{formatVnd(row.commissionVnd)}</dd>
          </div>
          <div>
            <dt className='text-muted-foreground text-xs'>Tỷ lệ ghi nhận qua mã</dt>
            <dd className='font-medium tabular-nums'>{row.viaCouponPercent}%</dd>
          </div>
        </dl>

        <div className='space-y-1.5'>
          <Label htmlFor='reconciliation-note'>Ghi chú của admin</Label>
          <Textarea
            id='reconciliation-note'
            value={note}
            maxLength={NOTE_LIMIT}
            rows={4}
            placeholder='Ví dụ: đã đối chiếu với kế toán ngày 05/10.'
            onChange={(e) => setNote(e.target.value)}
          />
          <p className='text-muted-foreground text-right text-xs'>
            {note.length}/{NOTE_LIMIT}
          </p>
        </div>

        {/* The three buttons both save the note and record the decision, so an
            admin never has to remember to press save as well. */}
        <div className='flex flex-wrap justify-end gap-2'>
          {STATUSES.map((option) => (
            <Button
              key={option.value}
              variant={option.value === row.status ? 'default' : 'outline'}
              disabled={pending}
              onClick={() => onApply(option.value, note)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
