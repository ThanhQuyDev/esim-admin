'use client';

/**
 * "Thanh toán" — the distribution partner's ký quỹ wallet (#047).
 *
 * There is no request to raise and nobody to wait for any more: the partner
 * types what they want to put in and pays. A bank transfer shows a SePay QR and
 * is credited the moment the transfer lands; a card goes through OnePay, which
 * charges for it, and the brief puts that on the partner — send 100.000đ by
 * card and 94.000đ reaches the wallet. The form says so before they choose,
 * because finding out afterwards is how a partner loses trust in the balance.
 */

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Icons } from '@/components/icons';
import { formatDateTimeVn, formatDateVn, formatVnd } from '@/lib/format';

import { createDepositRequestMutation } from '../api/mutations';
import type { MyDepositRequest, PartnerTopupMethod } from '../api/types';
import {
  myDepositRequestsQueryOptions,
  myWalletQueryOptions,
  myWalletTransactionsQueryOptions
} from '../api/queries';

/** Fallbacks only: the server sends the real policy in the wallet summary. */
const MIN_DEPOSIT_VND = 100_000;
const MAX_DEPOSIT_VND = 10_000_000;
const CARD_FEE_PERCENT = 6;

/** Amounts a partner reaches for, so the common case is one tap. */
const QUICK_AMOUNTS = [500_000, 1_000_000, 3_000_000, 5_000_000, 10_000_000];

const METHOD_LABEL: Record<string, string> = {
  bank_transfer: 'Chuyển khoản',
  card: 'Thẻ tín dụng'
};

const DEPOSIT_STATUS: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Chờ thanh toán',
    className:
      'border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300'
  },
  confirmed: {
    label: 'Đã xác nhận',
    className:
      'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
  },
  cancelled: {
    label: 'Đã huỷ',
    className:
      'border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
};

export function PortalWalletView() {
  const { data: wallet, isLoading } = useQuery(myWalletQueryOptions());
  const { data: transactions = [], isLoading: txLoading } = useQuery(
    myWalletTransactionsQueryOptions()
  );
  const { data: deposits = [] } = useQuery(myDepositRequestsQueryOptions());

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PartnerTopupMethod>('bank_transfer');
  const [error, setError] = useState<string | null>(null);
  // The QR stays on screen until the partner clears it: they need it while they
  // move to their banking app and come back.
  const [pending, setPending] = useState<MyDepositRequest | null>(null);

  const policy = wallet?.topupPolicy;
  const minVnd = policy?.minVnd ?? MIN_DEPOSIT_VND;
  const maxVnd = policy?.maxVnd ?? MAX_DEPOSIT_VND;
  const feePercent = policy?.cardFeePercent ?? CARD_FEE_PERCENT;

  const value = Number(amount || 0);
  const feeVnd = method === 'card' ? Math.round((value * feePercent) / 100) : 0;
  const creditedVnd = Math.max(0, value - feeVnd);

  const createDeposit = useMutation({
    ...createDepositRequestMutation,
    onSuccess: (result: MyDepositRequest) => {
      setAmount('');
      if (result.paymentUrl) {
        // Straight to the gateway: the partner came here to pay, not to read a
        // confirmation screen.
        toast.success('Đang chuyển tới cổng thanh toán OnePay…');
        window.location.href = result.paymentUrl;
        return;
      }
      setPending(result);
      toast.success('Đã tạo mã QR. Số dư cộng ngay khi chuyển khoản thành công.');
    },
    onError: (e: Error) => toast.error(e.message || 'Tạo giao dịch nạp thất bại.')
  });

  const validate = (): string | null => {
    if (!amount.trim()) return 'Nhập số tiền muốn nạp.';
    if (Number.isNaN(value)) return 'Số tiền không hợp lệ.';
    if (value < minVnd) return `Số tiền tối thiểu là ${formatVnd(minVnd)}.`;
    if (value > maxVnd) return `Số tiền tối đa mỗi lần là ${formatVnd(maxVnd)}.`;
    return null;
  };

  const submit = () => {
    const next = validate();
    setError(next);
    if (next) return;
    setPending(null);
    createDeposit.mutate({ amountVnd: value, method });
  };

  const cards = [
    {
      label: 'Số dư ký quỹ',
      value: formatVnd(wallet?.balanceVnd),
      badge: wallet?.status === 'locked' ? 'Đang khoá' : 'Hoạt động',
      icon: Icons.wallet,
      footerStrong: 'Tổng số dư trên ví',
      footer: 'Gồm cả phần đang chờ rút'
    },
    {
      label: 'Khả dụng',
      value: formatVnd(wallet?.availableBalanceVnd),
      badge: 'Dùng được',
      icon: Icons.check,
      footerStrong: 'Có thể tạo đơn hoặc rút',
      footer: 'Trừ ngay khi đơn được tạo thành công'
    },
    {
      label: 'Đang chờ rút',
      value: formatVnd(wallet?.pendingPayoutVnd),
      badge: 'Đã gửi yêu cầu',
      icon: Icons.clock,
      footerStrong: 'Chờ duyệt',
      footer: 'Khoản này tạm giữ cho tới khi xử lý xong'
    }
  ];

  return (
    <div className='flex flex-1 flex-col space-y-4'>
      <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-3'>
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className='@container/card'>
              <CardHeader>
                <CardDescription>{card.label}</CardDescription>
                <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                  {isLoading ? '…' : card.value}
                </CardTitle>
                <CardAction>
                  <Badge variant='outline'>
                    <Icon />
                    {card.badge}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                <div className='line-clamp-1 flex gap-2 font-medium'>{card.footerStrong}</div>
                <div className='text-muted-foreground'>{card.footer}</div>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nạp tiền vào ví</CardTitle>
          <CardDescription>
            Nhập số tiền muốn nạp, tối thiểu {formatVnd(minVnd)} và tối đa {formatVnd(maxVnd)} mỗi
            lần. Không cần chờ duyệt: chuyển khoản xong là số dư được cộng ngay.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='topupAmount'>
                Số tiền muốn nạp <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='topupAmount'
                type='number'
                inputMode='numeric'
                min={minVnd}
                max={maxVnd}
                step={1000}
                value={amount}
                placeholder={String(minVnd)}
                aria-invalid={Boolean(error)}
                aria-describedby='topupAmount-error'
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (error) setError(null);
                }}
                onBlur={() => setError(validate())}
              />
              {error ? (
                <p id='topupAmount-error' className='text-destructive text-xs'>
                  {error}
                </p>
              ) : (
                <p className='text-muted-foreground text-xs'>
                  Từ {formatVnd(minVnd)} đến {formatVnd(maxVnd)} mỗi lần nạp.
                </p>
              )}
              <div className='flex flex-wrap gap-2 pt-1'>
                {QUICK_AMOUNTS.filter((v) => v >= minVnd && v <= maxVnd).map((quick) => (
                  <Button
                    key={quick}
                    type='button'
                    size='sm'
                    variant={value === quick ? 'default' : 'outline'}
                    onClick={() => {
                      setAmount(String(quick));
                      setError(null);
                    }}
                  >
                    {formatVnd(quick)}
                  </Button>
                ))}
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Hình thức thanh toán</Label>
              <div className='grid gap-2'>
                <button
                  type='button'
                  onClick={() => setMethod('bank_transfer')}
                  className={`rounded-lg border p-3 text-left transition ${
                    method === 'bank_transfer' ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                  }`}
                >
                  <div className='flex items-center justify-between gap-2'>
                    <span className='font-medium'>Chuyển khoản (quét QR)</span>
                    <Badge variant='outline'>Không mất phí</Badge>
                  </div>
                  <p className='text-muted-foreground mt-1 text-xs'>
                    Quét mã VietQR bằng app ngân hàng. Hệ thống SePay đối chiếu tự động và cộng tiền
                    ngay.
                  </p>
                </button>
                <button
                  type='button'
                  onClick={() => setMethod('card')}
                  className={`rounded-lg border p-3 text-left transition ${
                    method === 'card' ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                  }`}
                >
                  <div className='flex items-center justify-between gap-2'>
                    <span className='font-medium'>Thẻ tín dụng (OnePay)</span>
                    <Badge variant='outline'>Phí {feePercent}%</Badge>
                  </div>
                  <p className='text-muted-foreground mt-1 text-xs'>
                    Phí {feePercent}% được trừ vào số tiền ký quỹ — ví dụ nạp {formatVnd(100_000)}{' '}
                    thì ví cộng {formatVnd(94_000)}.
                  </p>
                </button>
              </div>
            </div>
          </div>

          {value > 0 && (
            <div className='bg-muted/50 space-y-1 rounded-lg border p-3 text-sm'>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Số tiền thanh toán</span>
                <span className='font-medium tabular-nums'>{formatVnd(value)}</span>
              </div>
              {feeVnd > 0 && (
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Phí cổng thanh toán ({feePercent}%)</span>
                  <span className='text-destructive font-medium tabular-nums'>
                    −{formatVnd(feeVnd)}
                  </span>
                </div>
              )}
              <div className='flex justify-between border-t pt-1'>
                <span className='font-medium'>Được cộng vào ví</span>
                <span className='font-semibold tabular-nums'>{formatVnd(creditedVnd)}</span>
              </div>
            </div>
          )}

          <Button isLoading={createDeposit.isPending} onClick={submit}>
            {method === 'card' ? 'Thanh toán bằng thẻ' : 'Lấy mã QR chuyển khoản'}
          </Button>

          {pending?.qrUrl && (
            <div className='flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pending.qrUrl}
                alt='Mã VietQR để nạp ký quỹ'
                className='size-44 shrink-0 self-center rounded-md border bg-white'
              />
              <div className='space-y-1 text-sm'>
                <p className='font-medium'>Quét mã để chuyển {formatVnd(pending.amountVnd)}</p>
                <p className='text-muted-foreground'>
                  Ngân hàng {pending.bankCode} · {pending.accountNumber} · {pending.accountName}
                </p>
                <p>
                  Nội dung chuyển khoản:{' '}
                  <span className='font-mono font-medium'>{pending.bankTransferCode}</span>
                </p>
                <p className='text-muted-foreground text-xs'>
                  Giữ đúng nội dung chuyển khoản để hệ thống đối chiếu tự động. Số dư được cộng ngay
                  khi tiền vào, không cần chờ duyệt.
                </p>
                <Button size='sm' variant='outline' onClick={() => setPending(null)}>
                  Đóng mã QR
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex flex-wrap items-center gap-2'>
            Lịch sử nạp tiền
            <Badge variant='outline'>{deposits.length} lần</Badge>
          </CardTitle>
          <CardDescription>
            Mỗi lần nạp có mã đối chiếu riêng. Với thẻ tín dụng, cột "Cộng vào ví" đã trừ phí cổng
            thanh toán.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='rounded-lg border'>
            <Table>
              <TableHeader className='bg-muted'>
                <TableRow>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Hình thức</TableHead>
                  <TableHead className='text-right'>Số tiền</TableHead>
                  <TableHead className='text-right'>Cộng vào ví</TableHead>
                  <TableHead>Mã đối chiếu</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deposits.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className='h-24 text-center'>
                      <p className='text-muted-foreground text-sm'>Chưa có lần nạp nào.</p>
                      <p className='text-muted-foreground mt-1 text-xs'>
                        Nhập số tiền ở trên để nạp vào ví ký quỹ.
                      </p>
                    </TableCell>
                  </TableRow>
                )}
                {deposits.map((req) => {
                  const status = DEPOSIT_STATUS[req.status];
                  return (
                    <TableRow key={req.id}>
                      <TableCell className='whitespace-nowrap'>
                        {formatDateVn(req.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant='outline'>
                          {METHOD_LABEL[req.method ?? 'bank_transfer'] ?? req.method}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right font-medium tabular-nums'>
                        {formatVnd(req.amountVnd)}
                        {req.feeVnd ? (
                          <div className='text-muted-foreground text-xs'>
                            phí {formatVnd(req.feeVnd)}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className='text-right font-medium tabular-nums'>
                        {formatVnd(req.creditedVnd ?? req.amountVnd)}
                      </TableCell>
                      <TableCell className='font-mono text-xs break-all'>
                        {req.bankTransferCode}
                      </TableCell>
                      <TableCell>
                        {status ? (
                          <Badge variant='outline' className={status.className}>
                            {status.label}
                          </Badge>
                        ) : (
                          <Badge variant='outline'>{req.status}</Badge>
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

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử giao dịch</CardTitle>
          <CardDescription>Mọi khoản ghi có và ghi nợ trên ví ký quỹ.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='rounded-lg border'>
            <Table>
              <TableHeader className='bg-muted'>
                <TableRow>
                  <TableHead>Thời điểm</TableHead>
                  <TableHead>Nội dung</TableHead>
                  <TableHead className='text-right'>Số tiền</TableHead>
                  <TableHead className='text-right'>Số dư sau</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {txLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className='text-muted-foreground h-24 text-center'>
                      Đang tải giao dịch…
                    </TableCell>
                  </TableRow>
                )}
                {!txLoading && transactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className='h-24 text-center'>
                      <p className='text-muted-foreground text-sm'>Chưa có giao dịch nào.</p>
                    </TableCell>
                  </TableRow>
                )}
                {transactions.map((tx) => {
                  const isCredit = tx.amountVnd > 0;
                  return (
                    <TableRow key={tx.id}>
                      <TableCell className='whitespace-nowrap'>
                        {formatDateTimeVn(tx.createdAt)}
                      </TableCell>
                      <TableCell>{tx.reason || tx.type}</TableCell>
                      <TableCell className='text-right'>
                        <span
                          className={
                            isCredit
                              ? 'font-medium tabular-nums text-emerald-600 dark:text-emerald-400'
                              : 'font-medium tabular-nums text-red-600 dark:text-red-400'
                          }
                        >
                          {isCredit ? '+' : ''}
                          {formatVnd(tx.amountVnd)}
                        </span>
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>
                        {formatVnd(tx.balanceAfterVnd)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
