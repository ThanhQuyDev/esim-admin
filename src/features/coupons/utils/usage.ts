import type { Coupon } from '../api/types';

/**
 * How much of a discount code has been spent (#083).
 *
 * The admin listing showed the usage *limit* but never the usage itself, so
 * there was no way to tell a code nobody has touched from one that ran out
 * this morning — the question every campaign review starts with.
 */

export interface CouponUsage {
  used: number;
  /** null when the code has no usage limit. */
  limit: number | null;
  /** "12 / 100", or "12 / ∞" for an unlimited code. */
  label: string;
  /** Share of the limit used, 0–1. Always 0 for an unlimited code. */
  ratio: number;
  /** No uses left. */
  isExhausted: boolean;
  /** 90% or more of the limit is gone — worth topping up before it runs out. */
  isRunningOut: boolean;
}

export function couponUsage(coupon: Pick<Coupon, 'usageCount' | 'maxUsage'>): CouponUsage {
  const used = Math.max(0, Number(coupon.usageCount ?? 0));
  const rawLimit = Number(coupon.maxUsage ?? 0);
  const limit = rawLimit > 0 ? rawLimit : null;

  const ratio = limit ? Math.min(1, used / limit) : 0;

  return {
    used,
    limit,
    label: `${used.toLocaleString('vi-VN')} / ${limit ? limit.toLocaleString('vi-VN') : '∞'}`,
    ratio,
    isExhausted: limit !== null && used >= limit,
    isRunningOut: limit !== null && used < limit && ratio >= 0.9
  };
}
