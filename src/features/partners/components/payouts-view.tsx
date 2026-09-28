'use client';

/**
 * The withdrawal list on "Tài chính" (#068, #069, #070).
 *
 * A refusal always carries a reason, in the popup and in the bulk bar alike,
 * because the partner reads it on their own withdrawal screen — "bị từ chối"
 * with nothing after it is a support ticket, not an answer.
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
import { formatDateTimeVn, formatVnd } from '@/lib/format';

import { bulkPayoutDecisionMutation, markPayoutPaidMutation } from '../api/mutations';
import { payoutsQueryOptions } from '../api/queries';
import type { AdminPayoutRow } from '../api/types';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  paid: 'Đã thanh toán'
};
const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  approved: 'outline',
  rejected: 'destructive',
  paid: 'default'
};

const STATUS_FILTERS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'rejected', label: 'Từ chối' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'paid', label: 'Đã thanh toán' }
];

const NOTE_LIMIT = 1000;

const periodLabel = (period: string) => {
  const [year, month] = period.split('-');
  return `Tháng ${month}/${year}`;
};

export function PayoutsView() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [detailOf, setDetailOf] = useState<AdminPayoutRow | null>(null);
  const [bulkReject, setBulkReject] = useState(false);

  const queryClient = useQueryClient();
  const filters = useMemo(
    () => ({
      limit: 50,
      ...(search.trim() && { search: search.trim() }),
      ...(status !== 'all' && { status }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo })
    }),
    [search, status, dateFrom, dateTo]
  );

  const { data, isLoading } = useQuery(payoutsQueryOptions(filters));
  const payouts = data?.data ?? [];

  const decide = useMutation({
    ...bulkPayoutDecisionMutation,
    onSuccess: (result) => {
      toast.success(
        result.skipped.length > 0
          ? `Đã xử lý ${result.updated} yêu cầu; ${result.skipped.length} yêu cầu đã được xử lý trước đó.`
          : `Đã xử lý ${result.updated} yêu cầu.`
      );
      setSelected([]);
      setDetailOf(null);
      setBulkReject(false);
    },
    onError: (e: Error) => toast.error(e.message || 'Không xử lý được yêu cầu'),
    onSettled: () => queryClient.invalidateQueries()
  });

  const markPaid = useMutation({
    ...markPayoutPaidMutation,
    onSuccess: () => {
      toast.success('Đã đánh dấu đã thanh toán.');
      queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message || 'Cập nhật thất bại')
  });

  // Only a request still waiting can be approved or refused; a decision on an
  // already-settled row would be silently dropped by the backend anyway.
  const pendingSelected = selected.filter(
    (id) => payouts.find((p) => p.id === id)?.status === 'pending'
  );
  const allTicked = payouts.length > 0 && selected.length === payouts.length;

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <Input
          placeholder='Tìm tên, email, SĐT hoặc ID đối tác'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='max-w-[280px]'
        />
        <div className='flex items-center gap-1'>
          <Input
            type='date'
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className='w-[150px]'
            aria-label='Từ ngày'
          />
          <span className='text-muted-foreground text-sm'>→</span>
          <Input
            type='date'
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className='w-[150px]'
            aria-label='Đến ngày'
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className='w-[180px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((option) => (
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
            const query = new URLSearchParams(
              Object.entries(filters).reduce<Record<string, string>>((acc, [k, v]) => {
                if (k !== 'limit') acc[k] = String(v);
                return acc;
              }, {})
            ).toString();
            window.location.href = `/api/partners/payouts/export-excel?${query}`;
          }}
        >
          <Icons.download className='mr-2 h-4 w-4' />
          Xuất file
        </Button>
      </div>

      {selected.length > 0 && (
        <div className='bg-muted/50 space-y-2 rounded-lg border p-3'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='text-sm font-medium'>Đã chọn {selected.length} yêu cầu</span>
            {pendingSelected.length !== selected.length && (
              <span className='text-muted-foreground text-xs'>
                ({pendingSelected.length} yêu cầu còn chờ duyệt)
              </span>
            )}
            <Button
              size='sm'
              disabled={pendingSelected.length === 0 || decide.isPending}
              onClick={() => decide.mutate({ ids: pendingSelected, decision: 'approve' })}
            >
              Duyệt chi
            </Button>
            <Button
              size='sm'
              variant='destructive'
              disabled={pendingSelected.length === 0 || decide.isPending}
              onClick={() => setBulkReject((open) => !open)}
            >
              Từ chối
            </Button>
            <Button size='sm' variant='ghost' onClick={() => setSelected([])}>
              Bỏ chọn
            </Button>
          </div>
          {bulkReject && (
            <BulkRejectBox
              pending={decide.isPending}
              onSubmit={(reason) =>
                decide.mutate({ ids: pendingSelected, decision: 'reject', adminNote: reason })
              }
            />
          )}
        </div>
      )}

      {isLoading ? (
        <div className='flex justify-center py-12'>
          <Icons.spinner className='h-6 w-6 animate-spin' />
        </div>
      ) : payouts.length === 0 ? (
        <p className='text-muted-foreground py-12 text-center text-sm'>
          Không có yêu cầu rút tiền nào khớp bộ lọc.
        </p>
      ) : (
        <div className='rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-10'>
                  <Checkbox
                    checked={allTicked}
                    onCheckedChange={() => setSelected(allTicked ? [] : payouts.map((p) => p.id))}
                    aria-label='Chọn tất cả'
                  />
                </TableHead>
                <TableHead>Đối tác</TableHead>
                <TableHead>Kỳ tài chính</TableHead>
                <TableHead className='text-right'>Số tiền</TableHead>
                <TableHead>Phương thức</TableHead>
                <TableHead>Ngày yêu cầu</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className='text-right'>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(row.id)}
                      onCheckedChange={() =>
                        setSelected((prev) =>
                          prev.includes(row.id)
                            ? prev.filter((x) => x !== row.id)
                            : [...prev, row.id]
                        )
                      }
                      aria-label={`Chọn yêu cầu #${row.id}`}
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
                  <TableCell>{periodLabel(row.period)}</TableCell>
                  <TableCell className='text-right font-medium tabular-nums'>
                    {formatVnd(row.amountVnd)}
                  </TableCell>
                  <TableCell className='text-sm'>
                    {row.bankName ? (
                      <>
                        {row.bankName}
                        {row.bankAccountLast4 && (
                          <span className='text-muted-foreground'> ····{row.bankAccountLast4}</span>
                        )}
                      </>
                    ) : (
                      <span className='text-muted-foreground'>Chưa có tài khoản</span>
                    )}
                  </TableCell>
                  <TableCell className='text-sm'>{formatDateTimeVn(row.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[row.status] ?? 'secondary'}>
                      {STATUS_LABEL[row.status] ?? row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className='space-x-2 text-right whitespace-nowrap'>
                    <Button size='sm' variant='outline' onClick={() => setDetailOf(row)}>
                      Xem chi tiết
                    </Button>
                    {row.status === 'approved' && (
                      <Button
                        size='sm'
                        disabled={markPaid.isPending}
                        onClick={() => markPaid.mutate({ id: row.id, data: {} })}
                      >
                        Đã chuyển tiền
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {detailOf && (
        <PayoutDetailDialog
          row={detailOf}
          pending={decide.isPending}
          onClose={() => setDetailOf(null)}
          onDecide={(decision, note) =>
            decide.mutate({ ids: [detailOf.id], decision, adminNote: note })
          }
        />
      )}
    </div>
  );
}

/** The reason box the bulk "Từ chối" button opens (#069). */
function BulkRejectBox({
  pending,
  onSubmit
}: {
  pending: boolean;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');

  return (
    <div className='space-y-1.5'>
      <Label htmlFor='bulk-reject-reason'>Lý do từ chối (đối tác sẽ nhìn thấy)</Label>
      <Textarea
        id='bulk-reject-reason'
        value={reason}
        maxLength={NOTE_LIMIT}
        rows={2}
        placeholder='Ví dụ: sai thông tin tài khoản thụ hưởng.'
        onChange={(e) => setReason(e.target.value)}
      />
      <div className='flex justify-end'>
        <Button
          size='sm'
          variant='destructive'
          disabled={!reason.trim() || pending}
          onClick={() => onSubmit(reason.trim())}
        >
          Xác nhận từ chối
        </Button>
      </div>
    </div>
  );
}

/** "Chi tiết tài chính · <đối tác>" (#069). */
function PayoutDetailDialog({
  row,
  pending,
  onClose,
  onDecide
}: {
  row: AdminPayoutRow;
  pending: boolean;
  onClose: () => void;
  onDecide: (decision: 'approve' | 'reject', note: string) => void;
}) {
  const [note, setNote] = useState(row.adminNote ?? '');
  const settled = row.status !== 'pending';

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>
            Chi tiết tài chính · {row.contactName ?? `Đối tác #${row.partnerId}`}
          </DialogTitle>
        </DialogHeader>

        <dl className='grid grid-cols-2 gap-3 text-sm'>
          <div>
            <dt className='text-muted-foreground text-xs'>Kỳ tài chính</dt>
            <dd className='font-medium'>{periodLabel(row.period)}</dd>
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
            <dt className='text-muted-foreground text-xs'>Số tiền yêu cầu</dt>
            <dd className='font-semibold tabular-nums'>{formatVnd(row.amountVnd)}</dd>
          </div>
          <div>
            <dt className='text-muted-foreground text-xs'>Ngày tạo yêu cầu</dt>
            <dd className='font-medium'>{formatDateTimeVn(row.createdAt)}</dd>
          </div>
        </dl>

        <div className='space-y-1 rounded-lg border p-3 text-sm'>
          <p className='text-muted-foreground text-xs'>Thông tin ngân hàng</p>
          {row.bankName || row.bankAccountInfo ? (
            <>
              <p>
                <span className='text-muted-foreground'>Ngân hàng: </span>
                {row.bankName ?? '—'}
              </p>
              <p>
                <span className='text-muted-foreground'>Số tài khoản: </span>
                <span className='tabular-nums'>{row.bankAccountNumber ?? '—'}</span>
              </p>
              <p>
                <span className='text-muted-foreground'>Chủ tài khoản: </span>
                {row.bankAccountHolder ?? '—'}
              </p>
              {row.bankBranch && (
                <p>
                  <span className='text-muted-foreground'>Chi nhánh: </span>
                  {row.bankBranch}
                </p>
              )}
            </>
          ) : (
            <p className='text-muted-foreground'>Đối tác chưa khai báo tài khoản nhận tiền.</p>
          )}
        </div>

        <div className='space-y-1.5'>
          <Label htmlFor='payout-note'>
            Ghi chú của admin
            <span className='text-muted-foreground'> — bắt buộc khi từ chối</span>
          </Label>
          <Textarea
            id='payout-note'
            value={note}
            maxLength={NOTE_LIMIT}
            rows={3}
            placeholder='Ví dụ: sai thông tin tài khoản thụ hưởng.'
            onChange={(e) => setNote(e.target.value)}
            disabled={settled}
          />
          <p className='text-muted-foreground text-right text-xs'>
            {note.length}/{NOTE_LIMIT}
          </p>
        </div>

        {settled ? (
          <p className='text-muted-foreground text-sm'>
            Yêu cầu này đã được xử lý
            {row.processedAt ? ` ngày ${formatDateTimeVn(row.processedAt)}` : ''}.
          </p>
        ) : (
          <div className='flex flex-wrap justify-end gap-2'>
            <Button
              variant='destructive'
              disabled={!note.trim() || pending}
              onClick={() => onDecide('reject', note.trim())}
            >
              Từ chối
            </Button>
            <Button disabled={pending} onClick={() => onDecide('approve', note.trim())}>
              Duyệt chi
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
