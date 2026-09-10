import type { Coupon } from '../api/types';

/**
 * How a coupon's discount reads in the admin listing (#082).
 *
 * Codes can now be a percentage, a flat amount, or a percentage with a
 * ceiling. Printing "15%" for all three hides exactly the part an admin
 * needs to check — the cap — and shows a flat-amount code as a percentage it
 * does not have.
 */
export function couponDiscountLabel(
  coupon: Pick<Coupon, 'discountPercent' | 'discountType' | 'discountAmount' | 'maxDiscountAmount'>
): string {
  if (coupon.discountType === 'fixed') {
    return `${Number(coupon.discountAmount ?? 0).toLocaleString('vi-VN')}đ`;
  }

  const percent = `${Number(coupon.discountPercent ?? 0)}%`;
  const cap = Number(coupon.maxDiscountAmount ?? 0);
  if (cap > 0) {
    return `${percent} (tối đa ${cap.toLocaleString('vi-VN')}đ)`;
  }
  return percent;
}
