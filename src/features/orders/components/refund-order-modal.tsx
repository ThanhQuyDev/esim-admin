'use client';
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
import { Textarea } from '@/components/ui/textarea';
import { planDisplayName } from '@/features/plans/utils/plan-label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { formatVnd } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AIRALO_REFUND_REASONS,
  DEFAULT_AIRALO_REFUND_REASON,
  type AiraloRefundReason
} from '../utils/airalo-refund';
import type { OrderItem, RefundOrderRequest, RefundMode } from '../api/types';

const TIER_LABEL: Record<string, string> = {
  traveler: 'Du khách',
  silver: 'Bạc',
  gold: 'Vàng',
  platinum: 'Bạch kim'
};

export type RefundBenefits = {
  tier: string | null;
  cashbackPercent: number | null;
  cashbackVnd: number;
  referral: { rewardVnd: number; status: string; referrerTierSnapshot: string | null } | null;
};

/**
 * The share of a benefit a refund of `amountVnd` takes back — the backend's
 * rule: proportional to everything refunded so far, less what an earlier
 * refund already took (wallets.service getWalletBenefitReversalVnd).
 */
function reversalVnd(
  benefitVnd: number,
  r: { totalOrderValue: number; alreadyRefunded: number; amountVnd: number }
): number {
  if (!(benefitVnd > 0) || !(r.totalOrderValue > 0)) return 0;
  const share = (refunded: number) =>
    Math.round((benefitVnd * Math.min(refunded, r.totalOrderValue)) / r.totalOrderValue);
  return Math.max(0, share(r.alreadyRefunded + r.amountVnd) - share(r.alreadyRefunded));
}

/** "Cashback 3% (hạng Vàng lúc đặt) …" — the lines of "Tác động khi hoàn tiền". */
export function benefitLines(
  benefits: RefundBenefits | undefined,
  r: { totalOrderValue: number; alreadyRefunded: number; amountVnd: number }
): string[] {
  if (!benefits) {
    return [
      'Cashback của đơn sẽ bị thu hồi từ ví người mua',
      'Thưởng giới thiệu sẽ bị thu hồi (nếu có)'
    ];
  }
  const tier = benefits.tier ? (TIER_LABEL[benefits.tier] ?? benefits.tier) : null;
  const pct = benefits.cashbackPercent;
  const head = `Cashback${pct != null ? ` ${pct}%` : ''}${tier ? ` (hạng ${tier} lúc đặt)` : ''}`;
  const lines = [
    benefits.cashbackVnd > 0
      ? `${head}: ${formatVnd(benefits.cashbackVnd)} — thu hồi ${formatVnd(reversalVnd(benefits.cashbackVnd, r))} từ ví người mua`
      : `${head}: đơn không phát sinh cashback, không thu hồi gì`
  ];
  const ref = benefits.referral;
  if (!ref) {
    lines.push('Thưởng giới thiệu: đơn không dùng mã giới thiệu, không thu hồi gì');
  } else {
    const refTier = ref.referrerTierSnapshot
      ? ` (người giới thiệu hạng ${TIER_LABEL[ref.referrerTierSnapshot] ?? ref.referrerTierSnapshot} lúc đặt)`
      : '';
    lines.push(
      ref.status === 'credited'
        ? `Thưởng giới thiệu ${formatVnd(ref.rewardVnd)}${refTier} — thu hồi ${formatVnd(reversalVnd(ref.rewardVnd, r))}`
        : ref.status === 'pending'
          ? `Thưởng giới thiệu ${formatVnd(ref.rewardVnd)}${refTier} chưa cộng cho người giới thiệu — sẽ không được cộng`
          : `Thưởng giới thiệu ${formatVnd(ref.rewardVnd)}${refTier} đã được thu hồi trước đó`
    );
  }
  return lines;
}

interface RefundOrderModalProps {
  orderId: number;
  orderNumber: string;
  payableVndPrice: number;
  walletSpentVndAmount?: number | null;
  refundedAmountVnd?: number | null;
  /** Lines of the order, so part of it can be refunded on its own. */
  items?: OrderItem[];
  /**
   * What the refund takes back, as fixed when the order was placed (vande
   * #065): the buyer's tier and cashback, the referrer's reward.
   */
  benefits?: RefundBenefits;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RefundOrderRequest) => void;
  isSubmitting: boolean;
}

export function RefundOrderModal({
  orderId,
  orderNumber,
  payableVndPrice,
  walletSpentVndAmount,
  refundedAmountVnd,
  items = [],
  benefits,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting
}: RefundOrderModalProps) {
  const [mode, setMode] = useState<RefundMode>('wallet');
  const totalOrderValue = Number(payableVndPrice ?? 0) + Number(walletSpentVndAmount ?? 0);
  const alreadyRefunded = Number(refundedAmountVnd ?? 0);
  const maxRefundable = Math.max(0, totalOrderValue - alreadyRefunded);
  // Starts at 0 and follows the eSIMs ticked below (v3 #007). It used to start
  // at the order total, and because this modal stays mounted that total was
  // kept even after a partial refund — so the next refund asked for more than
  // was left and failed.
  const [amount, setAmount] = useState('0');
  const [reason, setReason] = useState('');
  const [adminNote, setAdminNote] = useState('');
  // Nothing picked = refund the whole order, as before. Lines with eSIMs are
  // picked eSIM by eSIM (#008, round 4); lines without any by the line.
  const [pickedEsimIds, setPickedEsimIds] = useState<number[]>([]);
  const [pickedItemIds, setPickedItemIds] = useState<number[]>([]);
  // Airalo has no cancel, but takes refund requests (doitac-1410 #079).
  const [askAiralo, setAskAiralo] = useState(true);
  const [airaloReason, setAiraloReason] = useState<AiraloRefundReason>(
    DEFAULT_AIRALO_REFUND_REASON
  );

  // Every opening starts clean, from the order as it is now.
  useEffect(() => {
    if (!open) return;
    setMode('wallet');
    setAmount('0');
    setReason('');
    setAdminNote('');
    setPickedEsimIds([]);
    setPickedItemIds([]);
    setAskAiralo(true);
    setAiraloReason(DEFAULT_AIRALO_REFUND_REASON);
  }, [open]);

  const isRefunded = (status?: string | null) => status === 'refunded';
  /** The supplier does not take these back (doitac-1410 #080). */
  const noRefund = (item: OrderItem) => item.plan?.isRefundable === false;
  const esimsOf = (item: OrderItem) => item.esims ?? [];
  const liveEsimsOf = (item: OrderItem) =>
    isRefunded(item.status) ? [] : esimsOf(item).filter((e) => !isRefunded(e.status));
  /**
   * A line's worth AFTER its share of the order discount (#009, round 4) — at
   * list price, refunding every line one by one gave the coupon back too.
   */
  const lineVnd = (item: OrderItem) => Number(item.netVndPrice ?? item.vndPrice ?? 0);
  /** One eSIM's worth: the net line over its quantity. */
  const unitVnd = (item: OrderItem) =>
    Math.round(lineVnd(item) / Math.max(Number(item.quantity ?? 1), 1));

  /**
   * What goes to the API: a line whose every eSIM is picked (and none was
   * refunded before) is refunded as a line; otherwise the picked eSIMs go
   * one by one, so an eSIM refunded earlier is never paid out twice.
   */
  function buildSelection(esimIds: number[], itemIds: number[]) {
    const orderItemIds: number[] = [];
    const singleEsimIds: number[] = [];
    let value = 0;
    for (const item of items) {
      if (isRefunded(item.status) || noRefund(item)) continue;
      const all = esimsOf(item);
      if (all.length === 0) {
        if (itemIds.includes(item.id)) {
          orderItemIds.push(item.id);
          value += lineVnd(item);
        }
        continue;
      }
      const live = liveEsimsOf(item);
      const picked = live.filter((e) => esimIds.includes(e.id));
      if (picked.length === 0) continue;
      if (picked.length === live.length && live.length === all.length) {
        orderItemIds.push(item.id);
        value += lineVnd(item);
      } else {
        singleEsimIds.push(...picked.map((e) => e.id));
        value += picked.length * unitVnd(item);
      }
    }
    return { orderItemIds, esimIds: singleEsimIds, value };
  }

  const selection = buildSelection(pickedEsimIds, pickedItemIds);
  const isPartial = selection.orderItemIds.length > 0 || selection.esimIds.length > 0;
  const selectedValue = selection.value;

  /** Airalo eSIMs this refund gives back: they can go to Airalo as a request. */
  const isAiralo = (item: OrderItem) => item.plan?.provider === 'airalo';
  const airaloIccids = items
    .filter((item) => isAiralo(item) && !isRefunded(item.status))
    .flatMap((item) => {
      const live = liveEsimsOf(item);
      if (!isPartial || selection.orderItemIds.includes(item.id)) return live;
      return live.filter((e) => selection.esimIds.includes(e.id));
    })
    .map((e) => e.iccid)
    .filter(Boolean);

  // A per-item refund can never exceed what those lines were worth.
  const cap = isPartial ? Math.min(selectedValue, maxRefundable) : maxRefundable;

  const amountVnd = parseInt(amount, 10);
  // An order with a line that cannot be refunded is refunded line by line,
  // never "the whole order" (doitac-1410 #080).
  const mustPick = items.some((item) => noRefund(item) && !isRefunded(item.status));
  // Nothing to refund is not a refund.
  const isValidAmount =
    !isNaN(amountVnd) && amountVnd > 0 && amountVnd <= cap && (!mustPick || isPartial);

  // Keep the amount in step with the selection so the admin does not have to
  // add the lines up by hand.
  function applySelection(esimIds: number[], itemIds: number[]) {
    setPickedEsimIds(esimIds);
    setPickedItemIds(itemIds);
    const next = buildSelection(esimIds, itemIds);
    const any = next.orderItemIds.length > 0 || next.esimIds.length > 0;
    setAmount(String(any ? Math.min(next.value, maxRefundable) : 0));
  }

  function toggleItem(item: OrderItem, value: boolean) {
    const live = liveEsimsOf(item).map((e) => e.id);
    if (esimsOf(item).length === 0) {
      applySelection(
        pickedEsimIds,
        value ? [...pickedItemIds, item.id] : pickedItemIds.filter((id) => id !== item.id)
      );
      return;
    }
    applySelection(
      value
        ? [...new Set([...pickedEsimIds, ...live])]
        : pickedEsimIds.filter((id) => !live.includes(id)),
      pickedItemIds
    );
  }

  function toggleEsim(esimId: number, value: boolean) {
    applySelection(
      value ? [...pickedEsimIds, esimId] : pickedEsimIds.filter((id) => id !== esimId),
      pickedItemIds
    );
  }

  /** Checked, half-checked or empty, from the eSIMs of the line. */
  function itemCheckState(item: OrderItem): boolean | 'indeterminate' {
    if (esimsOf(item).length === 0) return pickedItemIds.includes(item.id);
    const live = liveEsimsOf(item);
    const picked = live.filter((e) => pickedEsimIds.includes(e.id)).length;
    if (picked === 0) return false;
    return picked === live.length ? true : 'indeterminate';
  }

  const showItemPicker =
    items.length > 1 || items.some((item) => esimsOf(item).length > 1 || noRefund(item));

  function handleSubmit() {
    if (!isValidAmount) return;
    onSubmit({
      mode,
      amountVnd,
      reason: reason.trim() || undefined,
      adminNote: adminNote.trim() || undefined,
      orderItemIds: selection.orderItemIds.length ? selection.orderItemIds : undefined,
      esimIds: selection.esimIds.length ? selection.esimIds : undefined,
      airaloRefundReason: airaloIccids.length && askAiralo ? airaloReason : undefined
    });
  }

  function handleOpenChange(newOpen: boolean) {
    onOpenChange(newOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* Capped to the viewport with a scrolling body: an order with many
          products made the popup taller than the screen and pushed the
          confirm/cancel buttons out of reach (#014). Header and footer stay put. */}
      <DialogContent className='flex max-h-[90dvh] flex-col sm:max-w-[500px]'>
        <DialogHeader className='shrink-0'>
          <DialogTitle>Hoàn tiền đơn hàng</DialogTitle>
          <DialogDescription>
            Xử lý hoàn tiền cho đơn hàng{' '}
            <span className='font-mono font-medium'>{orderNumber}</span>
          </DialogDescription>
        </DialogHeader>

        <div
          className='-mr-2 min-h-0 flex-1 space-y-4 overflow-y-auto pr-2'
          data-testid='refund-modal-body'
        >
          {/* Order Summary */}
          <div className='rounded-lg border p-4 space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground text-sm'>Đơn hàng</span>
              <span className='font-mono text-sm font-medium'>{orderNumber}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground text-sm'>Tiền mặt đã thanh toán</span>
              <span className='text-sm font-medium'>{formatVnd(payableVndPrice)}</span>
            </div>
            {Number(walletSpentVndAmount ?? 0) > 0 && (
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>eXU đã sử dụng</span>
                <span className='text-sm font-medium'>
                  {formatVnd(Number(walletSpentVndAmount ?? 0))}
                </span>
              </div>
            )}
            {alreadyRefunded > 0 && (
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>Đã hoàn trước đó</span>
                <span className='text-sm font-medium text-amber-600'>
                  -{formatVnd(alreadyRefunded)}
                </span>
              </div>
            )}
            <div className='flex items-center justify-between border-t pt-2'>
              <span className='text-sm font-semibold'>Tối đa có thể hoàn</span>
              <span className='text-sm font-bold'>{formatVnd(maxRefundable)}</span>
            </div>
          </div>

          {/* Which lines — and which eSIMs of a line — to refund (#027, #008).
              Lines and eSIMs refunded before stay listed, struck through and
              locked, as the record of what was already given back. */}
          {showItemPicker && (
            <div className='space-y-2'>
              <Label>Hoàn theo từng sản phẩm / ICCID</Label>
              <p className='text-muted-foreground text-xs'>
                Giá đã trừ phần mã giảm giá của đơn, chia theo tỷ lệ giá từng sản phẩm.
              </p>
              <div className='space-y-2 rounded-lg border p-3' data-testid='refund-item-picker'>
                {items.map((item) => {
                  const lineDone =
                    isRefunded(item.status) ||
                    (esimsOf(item).length > 0 && liveEsimsOf(item).length === 0);
                  const blocked = noRefund(item);
                  const locked = lineDone || blocked;
                  const state = locked ? false : itemCheckState(item);
                  const expanded =
                    esimsOf(item).length > 1 &&
                    (state !== false || locked || esimsOf(item).some((e) => isRefunded(e.status)));
                  return (
                    <div key={item.id} className='space-y-1.5'>
                      <label
                        className={cn(
                          'flex items-center gap-3 text-sm',
                          locked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                        )}
                        data-testid={`refund-item-${item.id}`}
                        data-no-refund={blocked ? 'true' : undefined}
                      >
                        <Checkbox
                          checked={state}
                          disabled={locked}
                          onCheckedChange={(v) => toggleItem(item, v === true)}
                        />
                        <span className={cn('min-w-0 flex-1 truncate', lineDone && 'line-through')}>
                          {planDisplayName(item.plan, `Sản phẩm #${item.id}`)}
                          {item.plan?.provider ? (
                            <span className='text-muted-foreground'> · {item.plan.provider}</span>
                          ) : null}
                          {item.quantity > 1 ? (
                            <span className='text-muted-foreground'> · x{item.quantity}</span>
                          ) : null}
                          {lineDone ? (
                            <span className='text-muted-foreground'> · đã hoàn</span>
                          ) : blocked ? (
                            <span className='text-muted-foreground'> · không hỗ trợ hoàn tiền</span>
                          ) : null}
                        </span>
                        <span className={cn('font-mono text-sm', lineDone && 'line-through')}>
                          {formatVnd(lineVnd(item))}
                          {lineVnd(item) !== Number(item.vndPrice ?? 0) && (
                            <span
                              className='text-muted-foreground ml-1 text-xs line-through'
                              title='Giá niêm yết, trước khi chia mã giảm giá'
                            >
                              {formatVnd(item.vndPrice)}
                            </span>
                          )}
                        </span>
                      </label>
                      {expanded && (
                        <div className='ml-7 space-y-1 border-l pl-3'>
                          {esimsOf(item).map((esim) => {
                            const done = lineDone || isRefunded(esim.status);
                            const off = done || blocked;
                            return (
                              <label
                                key={esim.id}
                                className={cn(
                                  'flex items-center gap-2 text-xs',
                                  off ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                                )}
                                data-testid={`refund-esim-${esim.id}`}
                              >
                                <Checkbox
                                  checked={!off && pickedEsimIds.includes(esim.id)}
                                  disabled={off}
                                  onCheckedChange={(v) => toggleEsim(esim.id, v === true)}
                                />
                                <span className={cn('flex-1 font-mono', done && 'line-through')}>
                                  {esim.iccid || `eSIM #${esim.id}`}
                                </span>
                                <span className={cn('font-mono', done && 'line-through')}>
                                  {done ? 'đã hoàn' : formatVnd(unitVnd(item))}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className='text-muted-foreground text-xs'>
                {mustPick && !isPartial
                  ? 'Đơn có sản phẩm không hỗ trợ hoàn tiền (làm mờ ở trên): chọn sản phẩm / ICCID cần hoàn.'
                  : isPartial
                    ? 'Chỉ những sản phẩm / ICCID được chọn bị huỷ với nhà cung cấp và đánh dấu đã hoàn tiền. Phần còn lại giữ nguyên.'
                    : 'Không chọn gì = hoàn tiền cho toàn bộ đơn hàng (huỷ với tất cả nhà cung cấp). Tích một sản phẩm để chọn từng ICCID của nó.'}
              </p>
            </div>
          )}

          {/* Refund Mode */}
          <div className='space-y-2'>
            <Label htmlFor='refund-mode'>Phương thức hoàn tiền</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as RefundMode)}>
              <SelectTrigger id='refund-mode'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='wallet'>Hoàn vào ví eXu</SelectItem>
                <SelectItem value='direct_bank'>Hoàn trực tiếp (chuyển khoản)</SelectItem>
              </SelectContent>
            </Select>
            <p className='text-muted-foreground text-xs'>
              {mode === 'wallet'
                ? 'Tiền sẽ được hoàn vào ví eXu của người dùng, có hiệu lực 365 ngày.'
                : 'Admin sẽ xử lý chuyển khoản ngân hàng thủ công. Hệ thống chỉ ghi nhận.'}
            </p>
          </div>

          {/* Refund Amount */}
          <div className='space-y-2'>
            <Label htmlFor='refund-amount'>Số tiền hoàn (VND)</Label>
            <Input
              id='refund-amount'
              type='number'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={cap}
            />
            {!amountVnd ? (
              <p className='text-muted-foreground text-xs'>
                Chọn eSIM cần hoàn ở trên, hoặc nhập số tiền. Tối đa: {formatVnd(cap)}
              </p>
            ) : (
              !isValidAmount && (
                <p className='text-destructive text-xs'>
                  Số tiền không hợp lệ. Tối đa: {formatVnd(cap)}
                </p>
              )
            )}
          </div>

          {/* Reason */}
          <div className='space-y-2'>
            <Label htmlFor='refund-reason'>Lý do hoàn tiền</Label>
            <Textarea
              id='refund-reason'
              placeholder='Nhập lý do hoàn tiền'
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>

          {/* Airalo refund request (doitac-1410 #079) */}
          {airaloIccids.length > 0 && (
            <div className='space-y-2 rounded-lg border p-3' data-testid='airalo-refund-request'>
              <label className='flex items-start gap-2 text-sm font-medium'>
                <Checkbox
                  checked={askAiralo}
                  onCheckedChange={(v) => setAskAiralo(v === true)}
                  aria-label='Gửi yêu cầu hoàn tiền tới Airalo'
                  className='mt-0.5'
                />
                <span>
                  Gửi yêu cầu hoàn tiền tới Airalo ({airaloIccids.length} eSIM)
                  <span className='text-muted-foreground block text-xs font-normal break-all'>
                    ICCID: {airaloIccids.join(', ')}
                  </span>
                </span>
              </label>
              {askAiralo && (
                <>
                  <Select
                    value={airaloReason}
                    onValueChange={(v) => setAiraloReason(v as AiraloRefundReason)}
                  >
                    <SelectTrigger id='airalo-refund-reason' aria-label='Lý do gửi Airalo'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AIRALO_REFUND_REASONS.map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className='text-muted-foreground text-xs'>
                    Airalo duyệt thủ công từng yêu cầu; nếu được duyệt, tiền hoàn về dưới dạng
                    credit Airalo. Mã yêu cầu được lưu vào ghi chú đơn hàng.
                  </p>
                </>
              )}
            </div>
          )}

          {/* Admin Note */}
          <div className='space-y-2'>
            <Label htmlFor='refund-admin-note'>Ghi chú nội bộ</Label>
            <Textarea
              id='refund-admin-note'
              placeholder='Ghi chú dành cho admin (không hiển thị cho user)'
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={2}
            />
          </div>

          {/* Impact Preview */}
          <div className='bg-muted rounded-lg p-4'>
            <p className='mb-2 text-xs font-semibold'>Tác động khi hoàn tiền:</p>
            <ul className='space-y-1 text-xs' data-testid='refund-impact'>
              {/* The real figures of this order, not a fixed 2% / 10.000đ
                  (vande #065). */}
              {benefitLines(benefits, {
                totalOrderValue,
                alreadyRefunded,
                amountVnd: amountVnd || 0
              }).map((line) => (
                <li key={line} className='text-muted-foreground'>
                  • {line}
                </li>
              ))}
              {mode === 'wallet' && (
                <li className='text-green-600'>
                  • +{formatVnd(amountVnd || 0)} sẽ được hoàn vào ví eXu (365 ngày)
                </li>
              )}
              <li className='text-muted-foreground'>
                {isPartial
                  ? `• ${selection.orderItemIds.length} sản phẩm, ${selection.esimIds.length} ICCID được chọn → refunded; đơn chỉ chuyển sang refunded khi đã hoàn hết giá trị`
                  : '• Trạng thái đơn hàng → refunded'}
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className='shrink-0'>
          <Button variant='outline' onClick={() => handleOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValidAmount || isSubmitting}
            isLoading={isSubmitting}
          >
            Xác nhận hoàn {isValidAmount ? formatVnd(amountVnd) : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
