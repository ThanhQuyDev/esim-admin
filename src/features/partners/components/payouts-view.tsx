'use client';

/**
 * "Tài chính" (#068, #069, #070): every money request from partners in one
 * list — marketing partners asking to withdraw, distribution / API partners
 * paying in ký quỹ (vande #067, which retired the separate "Yêu cầu nạp ký
 * quỹ" screen).
 *
 * A refusal always carries a reason, in the popup and in the bulk bar alike,
 * because the partner reads it on their own screen — "bị từ chối" with nothing
 * after it is a support ticket, not an answer.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
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
import { depositRequestsQueryOptions, partnerKeys, payoutsQueryOptions } from '../api/queries';
import { confirmDepositRequest, rejectDepositRequest } from '../api/service';
import type { AdminPayoutRow, PartnerDepositRequest } from '../api/types';

/** One status list for both kinds; each maps it onto its own. */
const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  paid: 'Đã thanh toán',
  cancelled: 'Đã huỷ'
};
const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  approved: 'outline',
  rejected: 'destructive',
  paid: 'default',
  cancelled: 'outline'
};

const STATUS_FILTERS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'rejected', label: 'Từ chối' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'paid', label: 'Đã thanh toán' }
];

const KIND_FILTERS = [
  { value: 'all', label: 'Nạp & rút' },
  { value: 'withdraw', label: 'Rút tiền' },
  { value: 'deposit', label: 'Nạp ký quỹ' }
];

/** A deposit's own status → the one the list shows. Confirmed money is in the wallet. */
const DEPOSIT_STATUS: Record<string, string> = {
  pending: 'pending',
  confirmed: 'approved',
  rejected: 'rejected',
  cancelled: 'cancelled'
};
/** The list's status filter → a deposit's own; null when no deposit can match. */
const DEPOSIT_FILTER: Record<string, string | null> = {
  pending: 'pending',
  approved: 'confirmed',
  rejected: 'rejected',
  paid: null
};

const METHOD_LABEL: Record<string, string> = {
  bank_transfer: 'Chuyển khoản',
  card: 'Thẻ tín dụng'
};

const NOTE_LIMIT = 1000;

const periodLabel = (period: string) => {
  const [year, month] = period.split('-');
  return `Tháng ${month}/${year}`;
};

/** The last twelve financial periods, newest first (doitac-1410 #057). */
function recentPeriods(): string[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
}

const payoutCode = (row: AdminPayoutRow) => row.code ?? `RT${String(row.id).padStart(6, '0')}`;

/** A withdrawal or a deposit, in the shape the list reads. */
type FinanceRow = {
  key: string;
  kind: 'withdraw' | 'deposit';
  partnerId: number;
  partnerName: string;
  contactEmail: string | null;
  code: string;
  period: string;
  autoRaised: boolean;
  amountVnd: number;
  feeVnd: number;
  /** Signed: + reaches the wallet, − leaves it. */
  walletDeltaVnd: number;
  method: string;
  bankName: string | null;
  bankAccountLast4: string | null;
  createdAt: string;
  status: string;
  note: string | null;
  payout?: AdminPayoutRow;
  deposit?: PartnerDepositRequest;
};

const partnerLabel = (r: {
  partnerName?: string | null;
  contactName?: string | null;
  partnerId: number;
}) => r.partnerName ?? r.contactName ?? `Đối tác #${r.partnerId}`;

function fromPayout(row: AdminPayoutRow): FinanceRow {
  return {
    key: `w-${row.id}`,
    kind: 'withdraw',
    partnerId: row.partnerId,
    partnerName: partnerLabel(row),
    contactEmail: row.contactEmail,
    code: payoutCode(row),
    period: row.period,
    autoRaised: Boolean(row.autoRaised),
    amountVnd: row.amountVnd,
    feeVnd: 0,
    walletDeltaVnd: -row.amountVnd,
    method: 'Chuyển khoản',
    bankName: row.bankName,
    bankAccountLast4: row.bankAccountLast4,
    createdAt: row.createdAt,
    status: row.status,
    note: row.status === 'rejected' ? row.adminNote : null,
    payout: row
  };
}

function fromDeposit(row: PartnerDepositRequest): FinanceRow {
  const amount = Number(row.amountVnd);
  const created = new Date(row.createdAt);
  return {
    key: `d-${row.id}`,
    kind: 'deposit',
    partnerId: row.partnerId,
    partnerName: partnerLabel(row),
    contactEmail: row.contactEmail ?? null,
    code: row.bankTransferCode,
    period:
      row.period ?? `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`,
    autoRaised: false,
    amountVnd: amount,
    feeVnd: Number(row.feeVnd ?? 0),
    walletDeltaVnd: Number(row.creditedVnd ?? amount),
    method: METHOD_LABEL[row.method ?? 'bank_transfer'] ?? row.method ?? '—',
    bankName: row.bankName ?? null,
    bankAccountLast4: row.bankAccountLast4 ?? null,
    createdAt: row.createdAt,
    status: DEPOSIT_STATUS[row.status] ?? row.status,
    note: row.status === 'rejected' ? (row.rejectionReason ?? null) : null,
    deposit: row
  };
}

const signedVnd = (value: number) =>
  value > 0 ? `+${formatVnd(value)}` : value < 0 ? `−${formatVnd(-value)}` : formatVnd(0);

/** `initialKind` comes from `?type=deposit`, where the old ký quỹ screen now sends people. */
export function PayoutsView({ initialKind }: { initialKind?: string }) {
  const [kind, setKind] = useState(() =>
    KIND_FILTERS.some((k) => k.value === initialKind) ? initialKind! : 'all'
  );
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [period, setPeriod] = useState('all');
  const [selected, setSelected] = useState<number[]>([]);
  const [detailOf, setDetailOf] = useState<FinanceRow | null>(null);
  const [bulkReject, setBulkReject] = useState(false);

  const queryClient = useQueryClient();
  const common = useMemo(
    () => ({
      ...(search.trim() && { search: search.trim() }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
      ...(period !== 'all' && { period })
    }),
    [search, dateFrom, dateTo, period]
  );
  const payoutFilters = useMemo(
    () => ({ limit: 200, ...common, ...(status !== 'all' && { status }) }),
    [common, status]
  );
  const depositStatus = status === 'all' ? undefined : DEPOSIT_FILTER[status];
  const depositFilters = useMemo(
    () => ({ limit: 200, ...common, ...(depositStatus && { status: depositStatus }) }),
    [common, depositStatus]
  );

  const wantWithdraw = kind !== 'deposit';
  // "Đã thanh toán" is a withdrawal state; no deposit is ever in it.
  const wantDeposit = kind !== 'withdraw' && depositStatus !== null;

  const payoutsQuery = useQuery({ ...payoutsQueryOptions(payoutFilters), enabled: wantWithdraw });
  const depositsQuery = useQuery({
    ...depositRequestsQueryOptions(depositFilters),
    enabled: wantDeposit
  });
  const isLoading =
    (wantWithdraw && payoutsQuery.isLoading) || (wantDeposit && depositsQuery.isLoading);

  const rows = useMemo(() => {
    const list = [
      ...(wantWithdraw ? (payoutsQuery.data?.data ?? []).map(fromPayout) : []),
      ...(wantDeposit ? (depositsQuery.data ?? []).map(fromDeposit) : [])
    ];
    // Waiting first, then newest — the order the finance team works in.
    return list.toSorted(
      (a, b) =>
        Number(b.status === 'pending') - Number(a.status === 'pending') ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [wantWithdraw, wantDeposit, payoutsQuery.data, depositsQuery.data]);

  const payoutRows = rows.filter((r) => r.kind === 'withdraw');

  const refresh = () => void queryClient.invalidateQueries({ queryKey: partnerKeys.all });

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

  const confirmDeposit = useMutation({
    mutationFn: (id: number) => confirmDepositRequest(id),
    onSuccess: () => {
      toast.success('Đã duyệt và cộng tiền vào ví ký quỹ của đối tác.');
      setDetailOf(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message || 'Duyệt thất bại')
  });

  const rejectDeposit = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      rejectDepositRequest(id, reason),
    onSuccess: () => {
      toast.success('Đã từ chối yêu cầu nạp ký quỹ.');
      setDetailOf(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message || 'Từ chối thất bại')
  });

  // Only a withdrawal still waiting can be decided in bulk; a deposit credits
  // a wallet, so it is looked at one by one in its popup.
  const pendingSelected = selected.filter(
    (id) => payoutRows.find((r) => r.payout?.id === id)?.status === 'pending'
  );
  const allTicked = payoutRows.length > 0 && selected.length === payoutRows.length;

  return (
    <div className='grid min-w-0 grid-cols-1 gap-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <Input
          placeholder='Tìm tên, email, SĐT, ID đối tác hoặc mã yêu cầu'
          data-testid='payout-search'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='w-full sm:w-[340px]'
        />
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger
            className='w-full sm:w-[150px]'
            aria-label='Loại yêu cầu'
            data-testid='finance-kind'
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KIND_FILTERS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger
            className='w-[180px]'
            aria-label='Kỳ tài chính'
            data-testid='payout-period'
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Mọi kỳ tài chính</SelectItem>
            {recentPeriods().map((value) => (
              <SelectItem key={value} value={value}>
                {periodLabel(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className='w-[180px]' aria-label='Trạng thái' data-testid='payout-status'>
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
              Object.entries(payoutFilters).reduce<Record<string, string>>((acc, [k, v]) => {
                if (k !== 'limit') acc[k] = String(v);
                return acc;
              }, {})
            ).toString();
            window.location.href = `/api/partners/payouts/export-excel?${query}`;
          }}
        >
          <Icons.download className='mr-2 h-4 w-4' />
          Xuất file rút tiền
        </Button>
      </div>

      {selected.length > 0 && (
        <div className='bg-muted/50 space-y-2 rounded-lg border p-3'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='text-sm font-medium'>Đã chọn {selected.length} yêu cầu rút tiền</span>
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
      ) : rows.length === 0 ? (
        <p className='text-muted-foreground py-12 text-center text-sm'>
          Không có yêu cầu nạp/rút tiền nào khớp bộ lọc.
        </p>
      ) : (
        <div className='overflow-x-auto rounded-lg border' data-testid='finance-rows'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-10'>
                  <Checkbox
                    checked={allTicked}
                    disabled={payoutRows.length === 0}
                    onCheckedChange={() =>
                      setSelected(allTicked ? [] : payoutRows.map((r) => r.payout!.id))
                    }
                    aria-label='Chọn tất cả yêu cầu rút tiền'
                  />
                </TableHead>
                <TableHead>Đối tác</TableHead>
                <TableHead>Mã yêu cầu</TableHead>
                <TableHead>Kỳ tài chính</TableHead>
                <TableHead className='text-right'>Số tiền nạp/rút</TableHead>
                <TableHead className='text-right'>Phí nạp/rút</TableHead>
                <TableHead className='text-right'>Cộng/trừ vào ví</TableHead>
                <TableHead>Phương thức</TableHead>
                <TableHead>Ngân hàng</TableHead>
                <TableHead>Thời gian yêu cầu</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className='text-right'>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.key} data-testid={`finance-row-${row.key}`}>
                  <TableCell>
                    {row.payout && (
                      <Checkbox
                        checked={selected.includes(row.payout.id)}
                        onCheckedChange={() => {
                          const id = row.payout!.id;
                          setSelected((prev) =>
                            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                          );
                        }}
                        aria-label={`Chọn yêu cầu ${row.code}`}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/partners/${row.partnerId}`}
                      className='font-medium hover:underline'
                    >
                      {row.partnerName}
                    </Link>
                    <div className='text-muted-foreground text-xs'>
                      #{row.partnerId} · {row.contactEmail ?? '—'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='font-mono text-xs'>{row.code}</div>
                    <div className='text-muted-foreground text-xs'>
                      {row.kind === 'deposit' ? 'Nạp ký quỹ' : 'Rút tiền'}
                    </div>
                  </TableCell>
                  <TableCell className='whitespace-nowrap'>
                    {periodLabel(row.period)}
                    {row.autoRaised && (
                      <div className='text-muted-foreground text-xs'>Tự tạo khi chốt đối soát</div>
                    )}
                  </TableCell>
                  <TableCell className='text-right font-medium tabular-nums'>
                    {formatVnd(row.amountVnd)}
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {row.feeVnd > 0 ? formatVnd(row.feeVnd) : '—'}
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium whitespace-nowrap tabular-nums ${
                      row.walletDeltaVnd >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {signedVnd(row.walletDeltaVnd)}
                  </TableCell>
                  <TableCell className='text-sm whitespace-nowrap'>{row.method}</TableCell>
                  <TableCell className='text-sm whitespace-nowrap'>
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
                  <TableCell className='text-sm whitespace-nowrap'>
                    {formatDateTimeVn(row.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[row.status] ?? 'secondary'}>
                      {STATUS_LABEL[row.status] ?? row.status}
                    </Badge>
                    {row.note && (
                      <div className='text-muted-foreground mt-1 max-w-[200px] text-xs'>
                        {row.note}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className='space-x-2 text-right whitespace-nowrap'>
                    <Button
                      size='sm'
                      variant='outline'
                      data-testid={`finance-detail-${row.key}`}
                      onClick={() => setDetailOf(row)}
                    >
                      Xem chi tiết
                    </Button>
                    {row.payout?.status === 'approved' && (
                      <Button
                        size='sm'
                        disabled={markPaid.isPending}
                        onClick={() => markPaid.mutate({ id: row.payout!.id, data: {} })}
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

      {detailOf?.payout && (
        <PayoutDetailDialog
          row={detailOf.payout}
          pending={decide.isPending}
          onClose={() => setDetailOf(null)}
          onDecide={(decision, note) =>
            decide.mutate({ ids: [detailOf.payout!.id], decision, adminNote: note })
          }
        />
      )}
      {detailOf?.deposit && (
        <DepositDetailDialog
          row={detailOf}
          deposit={detailOf.deposit}
          pending={confirmDeposit.isPending || rejectDeposit.isPending}
          onClose={() => setDetailOf(null)}
          onApprove={() => confirmDeposit.mutate(detailOf.deposit!.id)}
          onReject={(reason) => rejectDeposit.mutate({ id: detailOf.deposit!.id, reason })}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className='text-muted-foreground text-xs'>{label}</dt>
      <dd className='font-medium'>{children}</dd>
    </div>
  );
}

/** "Chi tiết tài chính · <đối tác>" for a withdrawal (#069). */
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
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Chi tiết rút tiền · {partnerLabel(row)}</DialogTitle>
        </DialogHeader>

        <dl className='grid grid-cols-2 gap-3 text-sm'>
          <Field label='Mã yêu cầu'>
            <span className='font-mono'>{payoutCode(row)}</span>
          </Field>
          <Field label='Kỳ tài chính'>{periodLabel(row.period)}</Field>
          <Field label='Số tiền yêu cầu'>
            <span className='font-semibold tabular-nums'>{formatVnd(row.amountVnd)}</span>
          </Field>
          <Field label='Trừ vào ví'>
            <span className='text-red-600 tabular-nums'>{signedVnd(-row.amountVnd)}</span>
          </Field>
          <Field label='Ngày tạo yêu cầu'>{formatDateTimeVn(row.createdAt)}</Field>
          <Field label='Trạng thái'>
            <Badge variant={STATUS_VARIANT[row.status] ?? 'secondary'}>
              {STATUS_LABEL[row.status] ?? row.status}
            </Badge>
          </Field>
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
        ) : null}
        <div className='flex flex-wrap justify-end gap-2'>
          <Button variant='outline' onClick={onClose}>
            Hủy
          </Button>
          {!settled && (
            <>
              <Button
                variant='destructive'
                disabled={!note.trim() || pending}
                onClick={() => onDecide('reject', note.trim())}
              >
                Từ chối
              </Button>
              <Button disabled={pending} onClick={() => onDecide('approve', note.trim())}>
                Duyệt
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * "Chi tiết nạp ký quỹ" (vande #067): what was asked and how it was paid,
 * then Hủy / Từ chối / Duyệt. Duyệt credits the wallet, Từ chối needs a
 * reason the partner reads; neither can be undone.
 */
function DepositDetailDialog({
  row,
  deposit,
  pending,
  onClose,
  onApprove,
  onReject
}: {
  row: FinanceRow;
  deposit: PartnerDepositRequest;
  pending: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const settled = deposit.status !== 'pending';
  const settledAt = deposit.confirmedAt ?? deposit.rejectedAt;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Chi tiết nạp ký quỹ · {row.partnerName}</DialogTitle>
        </DialogHeader>

        <dl className='grid grid-cols-2 gap-3 text-sm'>
          <Field label='Mã yêu cầu'>
            <span className='font-mono'>{row.code}</span>
          </Field>
          <Field label='Kỳ tài chính'>{periodLabel(row.period)}</Field>
          <Field label='Số tiền nạp'>
            <span className='font-semibold tabular-nums'>{formatVnd(row.amountVnd)}</span>
          </Field>
          <Field label='Phí nạp tiền'>{row.feeVnd > 0 ? formatVnd(row.feeVnd) : '—'}</Field>
          <Field label='Cộng vào ví ký quỹ'>
            <span className='text-emerald-600 tabular-nums'>{signedVnd(row.walletDeltaVnd)}</span>
          </Field>
          <Field label='Hình thức nạp'>{row.method}</Field>
          <Field label='Ngày tạo yêu cầu'>{formatDateTimeVn(row.createdAt)}</Field>
          <Field label='Trạng thái'>
            <Badge variant={STATUS_VARIANT[row.status] ?? 'secondary'}>
              {STATUS_LABEL[row.status] ?? row.status}
            </Badge>
          </Field>
        </dl>

        <div className='space-y-1 rounded-lg border p-3 text-sm'>
          <p className='text-muted-foreground text-xs'>
            Tài khoản ngân hàng đối tác đã khai báo (để đối chiếu)
          </p>
          {deposit.bankName || deposit.bankAccountNumber ? (
            <>
              <p>
                <span className='text-muted-foreground'>Ngân hàng: </span>
                {deposit.bankName ?? '—'}
              </p>
              <p>
                <span className='text-muted-foreground'>Số tài khoản: </span>
                <span className='tabular-nums'>{deposit.bankAccountNumber ?? '—'}</span>
              </p>
              <p>
                <span className='text-muted-foreground'>Chủ tài khoản: </span>
                {deposit.bankAccountHolder ?? '—'}
              </p>
            </>
          ) : (
            <p className='text-muted-foreground'>Đối tác chưa khai báo tài khoản ngân hàng.</p>
          )}
          <p className='text-muted-foreground pt-1 text-xs'>
            Nội dung chuyển khoản cần có mã <span className='font-mono'>{row.code}</span>.
          </p>
        </div>

        {deposit.status === 'rejected' && deposit.rejectionReason && (
          <p className='text-sm'>
            <span className='text-muted-foreground'>Lý do từ chối: </span>
            {deposit.rejectionReason}
          </p>
        )}

        {settled ? (
          <p className='text-muted-foreground text-sm'>
            Yêu cầu này đã được xử lý{settledAt ? ` ngày ${formatDateTimeVn(settledAt)}` : ''}.
          </p>
        ) : (
          <div className='space-y-1.5'>
            <Label htmlFor='deposit-reject-reason'>Lý do từ chối</Label>
            <p className='text-muted-foreground text-xs'>
              Bắt buộc khi từ chối — đối tác sẽ nhìn thấy lý do này.
            </p>
            <Textarea
              id='deposit-reject-reason'
              rows={3}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder='Ví dụ: Không nhận được tiền chuyển khoản với mã đối chiếu này'
            />
            <p className='text-muted-foreground text-xs'>
              Duyệt sẽ cộng {formatVnd(row.walletDeltaVnd)} vào ví ký quỹ của đối tác. Duyệt hoặc từ
              chối đều không thể hoàn tác.
            </p>
          </div>
        )}

        <div className='flex flex-wrap justify-end gap-2'>
          <Button variant='outline' onClick={onClose}>
            Hủy
          </Button>
          {!settled && (
            <>
              <Button
                variant='destructive'
                data-testid='deposit-reject'
                disabled={pending || reason.trim().length < 5}
                onClick={() => onReject(reason.trim())}
              >
                Từ chối
              </Button>
              <Button data-testid='deposit-approve' disabled={pending} onClick={onApprove}>
                Duyệt
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
