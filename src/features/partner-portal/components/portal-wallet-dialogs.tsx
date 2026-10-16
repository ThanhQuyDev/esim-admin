'use client';

/**
 * The two money popups of the distribution partner's "Thanh toán" page
 * (doitac-1410 #030): "Nạp tiền ký quỹ" from the deposit balance card, and
 * "Rút tiền ký quỹ và hoa hồng" from the available balance card.
 *
 * Deposit: there is no request to raise and nobody to wait for. A bank transfer
 * shows a SePay QR and is credited the moment the transfer lands; a card goes
 * through OnePay, whose fee the brief puts on the partner — send 100.000đ by
 * card and 94.000đ reaches the wallet. The form says so before they choose.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
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
import { formatDateTimeVn, formatVnd } from '@/lib/format';

import { createDepositRequestMutation, createPayoutRequestMutation } from '../api/mutations';
import type { MyDepositRequest, PartnerTopupMethod } from '../api/types';
import { myProfileQueryOptions, myWalletQueryOptions } from '../api/queries';

/** Fallbacks only: the server sends the real policy in the wallet summary. */
const MIN_DEPOSIT_VND = 100_000;
const MAX_DEPOSIT_VND = 10_000_000;
const CARD_FEE_PERCENT = 6;
const FALLBACK_MIN_PAYOUT_VND = 50_000;

/** Amounts a partner reaches for, so the common case is one tap. */
const QUICK_AMOUNTS = [500_000, 1_000_000, 3_000_000, 5_000_000, 10_000_000];

const PAYOUT_FEE_LABEL = '0đ';
const PAYOUT_ETA_LABEL = '1–3 ngày làm việc';

/** "•••• 1234" — the account is shown, never the full number. */
function maskAccount(accountNumber: string | null | undefined): string {
  if (!accountNumber) return 'Chưa cập nhật';
  return `•••• ${accountNumber.slice(-4)}`;
}

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** "Nạp tiền ký quỹ" (doitac-1410 #030). */
export function DepositDialog({ open, onOpenChange }: DialogProps) {
  const { data: wallet } = useQuery(myWalletQueryOptions());

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PartnerTopupMethod>('bank_transfer');
  const [error, setError] = useState<string | null>(null);
  // The QR stays on screen until the partner closes it: they need it while
  // they move to their banking app and come back.
  const [pending, setPending] = useState<MyDepositRequest | null>(null);

  const policy = wallet?.topupPolicy;
  const minVnd = policy?.minVnd ?? MIN_DEPOSIT_VND;
  const maxVnd = policy?.maxVnd ?? MAX_DEPOSIT_VND;
  const feePercent = policy?.cardFeePercent ?? CARD_FEE_PERCENT;

  const value = Number(amount || 0);
  const feeVnd = method === 'card' ? Math.round((value * feePercent) / 100) : 0;
  const creditedVnd = Math.max(0, value - feeVnd);

  // Running deposit promotions, and what this amount would earn under the
  // best of them (doitac-1410 #015) — the server applies the same rule.
  const promotions = wallet?.depositPromotions ?? [];
  const expectedBonus = promotions.reduce((best, p) => {
    if (!(value >= p.minDepositVnd)) return best;
    const raw = Math.floor((value * p.bonusPercent) / 100);
    return Math.max(best, p.maxBonusVnd != null ? Math.min(raw, p.maxBonusVnd) : raw);
  }, 0);

  const createDeposit = useMutation({
    ...createDepositRequestMutation,
    onSuccess: (result: MyDepositRequest) => {
      setAmount('');
      if (result.paymentUrl) {
        // Straight to the gateway: the partner came here to pay.
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

  const close = (next: boolean) => {
    if (!next) {
      setPending(null);
      setError(null);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className='sm:max-w-[640px]' data-testid='deposit-dialog'>
        <DialogHeader>
          <DialogTitle>Nạp tiền ký quỹ</DialogTitle>
          <DialogDescription>
            Nhập số tiền muốn nạp, tối thiểu {formatVnd(minVnd)} và tối đa {formatVnd(maxVnd)} mỗi
            lần. Không cần chờ duyệt: chuyển khoản xong là số dư được cộng ngay.
          </DialogDescription>
        </DialogHeader>

        {pending?.qrUrl ? (
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
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
            </div>
          </div>
        ) : (
          <div className='space-y-4'>
            {promotions.length > 0 && (
              <div
                className='rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
                data-testid='deposit-promotions'
              >
                <p className='font-medium'>Đang có khuyến mãi nạp ký quỹ</p>
                <ul className='mt-1 space-y-0.5 text-xs'>
                  {promotions.map((p) => (
                    <li key={`${p.name}-${p.minDepositVnd}`}>
                      {p.name}: nạp từ {formatVnd(p.minDepositVnd)} tặng thêm {p.bonusPercent}%
                      {p.maxBonusVnd != null ? ` (tối đa ${formatVnd(p.maxBonusVnd)})` : ''}, đến{' '}
                      {formatDateTimeVn(p.endsAt)}.
                    </li>
                  ))}
                </ul>
                {expectedBonus > 0 && (
                  <p className='mt-2 text-xs font-medium' data-testid='expected-bonus'>
                    Lần nạp này được tặng thêm {formatVnd(expectedBonus)} vào ví.
                  </p>
                )}
              </div>
            )}

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
              <div className='grid gap-2 sm:grid-cols-2'>
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

            {value > 0 && (
              <div className='bg-muted/50 space-y-1 rounded-lg border p-3 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Số tiền thanh toán</span>
                  <span className='font-medium tabular-nums'>{formatVnd(value)}</span>
                </div>
                {feeVnd > 0 && (
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>
                      Phí cổng thanh toán ({feePercent}%)
                    </span>
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
          </div>
        )}

        <DialogFooter>
          {pending?.qrUrl ? (
            <Button variant='outline' onClick={() => close(false)}>
              Đã chuyển khoản, đóng
            </Button>
          ) : (
            <>
              <Button variant='outline' onClick={() => close(false)}>
                Huỷ
              </Button>
              <Button isLoading={createDeposit.isPending} onClick={submit}>
                {method === 'card' ? 'Thanh toán bằng thẻ' : 'Lấy mã QR chuyển khoản'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** "Rút tiền ký quỹ và hoa hồng" (doitac-1410 #030). */
export function WithdrawDialog({ open, onOpenChange }: DialogProps) {
  const { data: wallet } = useQuery(myWalletQueryOptions());
  const { data: me } = useQuery(myProfileQueryOptions());

  const available = wallet?.availableBalanceVnd ?? 0;
  const minPayout = wallet?.payoutMinVnd ?? FALLBACK_MIN_PAYOUT_VND;
  const awaiting = (wallet?.pendingCommissionVnd ?? 0) + (wallet?.pendingPayoutVnd ?? 0);
  const hasBank = Boolean(me?.bankAccountNumber);

  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const requested = Number(amount || 0);

  const bankLabel = me
    ? [me.bankName, maskAccount(me.bankAccountNumber), me.bankAccountHolder]
        .filter(Boolean)
        .join(' · ')
    : 'Chưa cập nhật';

  const close = (next: boolean) => {
    if (!next) {
      setConfirming(false);
      setError(null);
    }
    onOpenChange(next);
  };

  const createPayout = useMutation({
    ...createPayoutRequestMutation,
    onSuccess: () => {
      setAmount('');
      toast.success('Đã gửi yêu cầu rút tiền.');
      close(false);
    },
    onError: (e: Error) => {
      setConfirming(false);
      toast.error(e.message || 'Không gửi được yêu cầu, vui lòng thử lại.');
    }
  });

  const validate = (): string | null => {
    if (!amount.trim()) return 'Nhập số tiền muốn rút.';
    if (Number.isNaN(requested)) return 'Số tiền không hợp lệ.';
    if (requested < minPayout) return `Số tiền tối thiểu là ${formatVnd(minPayout)}.`;
    if (requested > available) return `Số dư khả dụng chỉ còn ${formatVnd(available)}.`;
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className='sm:max-w-[560px]' data-testid='withdraw-dialog'>
        <DialogHeader>
          <DialogTitle>
            {confirming ? 'Xác nhận yêu cầu rút tiền' : 'Rút tiền ký quỹ và hoa hồng'}
          </DialogTitle>
          <DialogDescription>
            {confirming
              ? 'Kiểm tra kỹ thông tin trước khi gửi. Yêu cầu đã gửi không tự huỷ được.'
              : 'Tiền được chuyển về tài khoản ngân hàng trong hồ sơ của bạn.'}
          </DialogDescription>
        </DialogHeader>

        {confirming ? (
          <div className='grid gap-3 sm:grid-cols-2'>
            {[
              ['Số tiền rút', formatVnd(requested)],
              ['Số dư sau khi rút', formatVnd(available - requested)],
              ['Ngân hàng', me?.bankName ?? '—'],
              ['Số tài khoản', maskAccount(me?.bankAccountNumber)],
              ['Phí rút', PAYOUT_FEE_LABEL],
              ['Thời gian dự kiến', PAYOUT_ETA_LABEL]
            ].map(([label, value]) => (
              <div key={label} className='bg-muted/40 rounded-lg border p-3'>
                <p className='text-muted-foreground text-xs'>{label}</p>
                <p className='mt-0.5 text-sm font-medium tabular-nums'>{value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className='space-y-4'>
            <div className='grid gap-3 sm:grid-cols-2'>
              <div className='bg-muted/40 rounded-lg border p-3'>
                <p className='text-muted-foreground text-xs'>Số tiền có thể rút</p>
                <p className='mt-0.5 text-lg font-semibold tabular-nums'>{formatVnd(available)}</p>
              </div>
              <div className='bg-muted/40 rounded-lg border p-3'>
                <p className='text-muted-foreground text-xs'>Đang chờ đối soát</p>
                <p className='mt-0.5 text-lg font-semibold tabular-nums'>{formatVnd(awaiting)}</p>
                <p className='text-muted-foreground text-xs'>Chưa rút được</p>
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='withdrawAmount'>
                Số tiền muốn rút <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='withdrawAmount'
                type='number'
                inputMode='numeric'
                min={minPayout}
                max={available}
                step={1000}
                value={amount}
                placeholder={String(minPayout)}
                aria-invalid={Boolean(error)}
                aria-describedby='withdrawAmount-error'
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (error) setError(null);
                }}
                onBlur={() => setError(validate())}
              />
              {error ? (
                <p id='withdrawAmount-error' className='text-destructive text-xs'>
                  {error}
                </p>
              ) : (
                <p className='text-muted-foreground text-xs'>
                  Tối thiểu {formatVnd(minPayout)} · Phí rút {PAYOUT_FEE_LABEL} · Nhận tiền trong{' '}
                  {PAYOUT_ETA_LABEL.toLowerCase()}.
                </p>
              )}
              {available >= minPayout && (
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  onClick={() => {
                    setAmount(String(available));
                    setError(null);
                  }}
                >
                  Rút toàn bộ {formatVnd(available)}
                </Button>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='withdrawAccount'>Tài khoản nhận tiền</Label>
              <Input id='withdrawAccount' value={bankLabel} disabled />
              {!hasBank && (
                <p className='text-destructive text-xs'>
                  Cần có tài khoản ngân hàng trong hồ sơ trước khi rút.{' '}
                  <Link href='/dashboard/portal/profile?tab=payment' className='underline'>
                    Cập nhật ngay
                  </Link>
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {confirming ? (
            <>
              <Button variant='outline' onClick={() => setConfirming(false)}>
                Quay lại
              </Button>
              <Button
                isLoading={createPayout.isPending}
                onClick={() =>
                  createPayout.mutate({ amountVnd: requested, bankAccountInfo: bankLabel })
                }
              >
                Gửi yêu cầu
              </Button>
            </>
          ) : (
            <>
              <Button variant='outline' onClick={() => close(false)}>
                Huỷ
              </Button>
              <Button
                disabled={!hasBank}
                onClick={() => {
                  const next = validate();
                  setError(next);
                  if (!next) setConfirming(true);
                }}
              >
                Yêu cầu rút tiền
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
