'use client';

/**
 * Withdrawals.
 *
 * Request form beside the saved payout account, with the request history
 * below. Validation follows the admin's form rules: the error sits under the
 * field it belongs to and is announced through `aria-describedby`, rather than
 * appearing as a detached toast.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { formatDateVn, formatVnd } from '@/lib/format';

import { createPayoutRequestMutation } from '../api/mutations';
import {
  myPayoutsQueryOptions,
  myProfileQueryOptions,
  mySummaryQueryOptions
} from '../api/queries';

const MIN_PAYOUT_VND = 100_000;

const PAYOUT_STATUS: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Chờ duyệt',
    className:
      'border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300'
  },
  approved: {
    label: 'Đã duyệt',
    className:
      'border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300'
  },
  paid: {
    label: 'Đã chuyển',
    className:
      'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
  },
  rejected: {
    label: 'Bị từ chối',
    className:
      'border-red-200 bg-red-100 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300'
  }
};

/** What the partner is promised when they press the button (#030). */
const PAYOUT_FEE_LABEL = '0đ';
const PAYOUT_ETA_LABEL = '1–3 ngày làm việc';

/** "•••• 1234" — the account is shown, never the full number. */
function maskAccount(accountNumber: string | null | undefined): string {
  if (!accountNumber) return 'Chưa cập nhật';
  return `•••• ${accountNumber.slice(-4)}`;
}

export function PortalPayoutsView() {
  const { data: summary } = useQuery(mySummaryQueryOptions());
  const { data: me } = useQuery(myProfileQueryOptions());
  const { data: payouts } = useQuery(myPayoutsQueryOptions());

  const available = summary?.wallet.availableBalanceVnd ?? 0;
  // Commission taken back after it was already paid out: the next periods pay
  // it off before anything is withdrawable again (#007).
  const carriedDebt = summary?.wallet.carriedDebtVnd ?? 0;
  const hasBank = Boolean(me?.bankAccountNumber);

  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const requested = Number(amount || 0);

  const createPayout = useMutation({
    ...createPayoutRequestMutation,
    onSuccess: () => {
      setConfirming(false);
      setAmount('');
      toast.success('Đã gửi yêu cầu rút tiền.');
    },
    onError: (e: Error) => {
      setConfirming(false);
      toast.error(e.message || 'Không gửi được yêu cầu, vui lòng thử lại.');
    }
  });

  /** Validate on blur, as the admin forms do, so the error arrives before submit. */
  const validate = (): string | null => {
    if (!amount.trim()) return 'Nhập số tiền muốn rút.';
    if (Number.isNaN(requested)) return 'Số tiền không hợp lệ.';
    if (requested < MIN_PAYOUT_VND) return `Số tiền tối thiểu là ${formatVnd(MIN_PAYOUT_VND)}.`;
    if (requested > available) return `Số dư khả dụng chỉ còn ${formatVnd(available)}.`;
    return null;
  };

  const submit = () => {
    const next = validate();
    setError(next);
    if (next) return;
    setConfirming(true);
  };

  const bankLabel = me
    ? [me.bankName, maskAccount(me.bankAccountNumber), me.bankAccountHolder]
        .filter(Boolean)
        .join(' · ')
    : 'Chưa cập nhật';

  return (
    <div className='flex flex-1 flex-col space-y-4'>
      <div className='grid gap-4 md:grid-cols-2'>
        <Card className='@container/card'>
          <CardHeader>
            <CardDescription>Số dư có thể rút</CardDescription>
            <CardTitle className='text-3xl font-semibold tabular-nums'>
              {formatVnd(available)}
            </CardTitle>
            <CardDescription>
              {formatVnd(summary?.commissionPendingVnd)} đang chờ đối soát, chưa rút được.
            </CardDescription>
            {carriedDebt > 0 && (
              <CardDescription className='text-destructive'>
                Đang bị trừ {formatVnd(carriedDebt)} do đơn đã nhận hoa hồng bị hoàn tiền hoặc hủy —
                số này cấn trừ vào hoa hồng của kỳ thanh toán tiếp theo.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className='space-y-4'>
            <Separator />
            <div className='space-y-2'>
              <Label htmlFor='payoutAmount'>
                Số tiền muốn rút <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='payoutAmount'
                type='number'
                inputMode='numeric'
                min={MIN_PAYOUT_VND}
                max={available}
                step={1000}
                value={amount}
                placeholder={String(MIN_PAYOUT_VND)}
                aria-invalid={Boolean(error)}
                aria-describedby='payoutAmount-help payoutAmount-error'
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (error) setError(null);
                }}
                onBlur={() => setError(validate())}
              />
              {error ? (
                <p id='payoutAmount-error' className='text-destructive text-xs'>
                  {error}
                </p>
              ) : (
                <p id='payoutAmount-help' className='text-muted-foreground text-xs'>
                  Tối thiểu {formatVnd(MIN_PAYOUT_VND)} · Phí rút {PAYOUT_FEE_LABEL} · Nhận tiền
                  trong {PAYOUT_ETA_LABEL.toLowerCase()}.
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='payoutAccount'>Tài khoản nhận</Label>
              <Input id='payoutAccount' value={bankLabel} disabled />
            </div>
          </CardContent>
          <CardFooter className='flex-wrap gap-2'>
            <Button onClick={submit} disabled={!hasBank || createPayout.isPending}>
              Yêu cầu rút tiền
            </Button>
            {!hasBank && (
              <p className='text-muted-foreground text-xs'>
                Cần có tài khoản ngân hàng trong hồ sơ trước khi rút.
              </p>
            )}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex flex-wrap items-center gap-2'>
              Tài khoản thanh toán
              <Badge variant={hasBank ? 'default' : 'destructive'}>
                {hasBank ? 'Đã cập nhật' : 'Chưa cập nhật'}
              </Badge>
            </CardTitle>
            <CardDescription>
              Thông tin phải trùng với chủ tài khoản đã xác minh trong hồ sơ.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {[
              ['Ngân hàng', me?.bankName],
              ['Chủ tài khoản', me?.bankAccountHolder],
              ['Số tài khoản', maskAccount(me?.bankAccountNumber)],
              ['Chi nhánh', me?.bankBranch]
            ].map(([label, value]) => (
              <div
                key={label as string}
                className='flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4'
              >
                <span className='text-muted-foreground w-36 shrink-0 text-sm font-medium'>
                  {label}
                </span>
                <span className='text-sm'>{value || '—'}</span>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            {/* Changing the account needs the emailed code (#005), which lives
                on the profile screen. */}
            <Button asChild variant='outline' size='sm'>
              <Link href='/dashboard/portal/profile'>Đổi tài khoản</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex flex-wrap items-center gap-2'>
            Lịch sử thanh toán
            <Badge variant='outline'>{(payouts ?? []).length} yêu cầu</Badge>
          </CardTitle>
          <CardDescription>Các yêu cầu gần đây và trạng thái xử lý.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='rounded-lg border'>
            <Table>
              <TableHeader className='bg-muted'>
                <TableRow>
                  <TableHead>Mã yêu cầu</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className='text-right'>Số tiền</TableHead>
                  <TableHead>Tài khoản nhận</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(payouts ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className='h-24 text-center'>
                      <p className='text-muted-foreground text-sm'>Chưa có yêu cầu rút tiền nào.</p>
                      <p className='text-muted-foreground mt-1 text-xs'>
                        Khi số dư khả dụng đạt {formatVnd(MIN_PAYOUT_VND)}, bạn có thể tạo yêu cầu ở
                        trên.
                      </p>
                    </TableCell>
                  </TableRow>
                )}
                {(payouts ?? []).map((p) => {
                  const status = PAYOUT_STATUS[p.status];
                  return (
                    <TableRow key={p.id}>
                      <TableCell className='font-mono text-xs'>
                        WD-{String(p.id).padStart(6, '0')}
                      </TableCell>
                      <TableCell className='whitespace-nowrap'>
                        {formatDateVn(p.createdAt)}
                      </TableCell>
                      <TableCell className='text-right font-medium tabular-nums'>
                        {formatVnd(p.amountVnd)}
                      </TableCell>
                      <TableCell className='text-muted-foreground text-xs'>
                        {p.bankAccountInfo || '—'}
                      </TableCell>
                      <TableCell>
                        {status ? (
                          <Badge variant='outline' className={status.className}>
                            {status.label}
                          </Badge>
                        ) : (
                          <Badge variant='outline'>{p.status}</Badge>
                        )}
                        {/* A refusal with nothing after it is a support
                            ticket, not an answer (#069). */}
                        {p.status === 'rejected' && p.adminNote && (
                          <p className='text-destructive mt-1 max-w-[280px] text-xs'>
                            {p.adminNote}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận yêu cầu rút tiền</DialogTitle>
            <DialogDescription>
              Kiểm tra kỹ thông tin trước khi gửi. Yêu cầu đã gửi không tự huỷ được.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-3 sm:grid-cols-2'>
            {[
              ['Số tiền rút', formatVnd(requested)],
              ['Số dư sau khi rút', formatVnd(available - requested)],
              ['Ngân hàng', me?.bankName ?? '—'],
              ['Số tài khoản', maskAccount(me?.bankAccountNumber)],
              // Both are promises the partner is owed before they commit (#030).
              ['Phí rút', PAYOUT_FEE_LABEL],
              ['Thời gian dự kiến', PAYOUT_ETA_LABEL]
            ].map(([label, value]) => (
              <div key={label} className='bg-muted/40 rounded-lg border p-3'>
                <p className='text-muted-foreground text-xs'>{label}</p>
                <p className='mt-0.5 text-sm font-medium tabular-nums'>{value}</p>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setConfirming(false)}>
              Huỷ
            </Button>
            <Button
              isLoading={createPayout.isPending}
              onClick={() =>
                createPayout.mutate({ amountVnd: requested, bankAccountInfo: bankLabel })
              }
            >
              Gửi yêu cầu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
