import * as z from 'zod';

const couponFields = {
  code: z.string().min(2, 'Mã coupon phải có ít nhất 2 ký tự'),
  /** Only a percentage code needs this; a fixed-amount code sends 0 (#038). */
  discountPercent: z.number().min(0, 'Giảm giá không được âm').max(100, 'Giảm giá tối đa 100%'),
  maxUsage: z.number().min(1, 'Số lần sử dụng tối thiểu là 1'),
  maxUsagePerUser: z.number().min(1, 'Số lần sử dụng/người tối thiểu là 1'),
  minOrderAmount: z.number().min(0, 'Giá trị đơn hàng tối thiểu không được âm'),
  expiresAt: z.string().min(1, 'Ngày hết hạn là bắt buộc'),
  /** 'percent' = % off, 'fixed' = a flat VND amount off (#082). */
  discountType: z.enum(['percent', 'fixed']).optional(),
  discountAmount: z.number().min(0, 'Số tiền giảm không được âm').optional(),
  maxDiscountAmount: z.number().min(0, 'Mức giảm tối đa không được âm').nullable().optional(),
  isActive: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  /** false = private: usable when typed in, never listed on the cart page. */
  isPublic: z.boolean().optional(),
  /** null = house-wide coupon, not owned by any partner. */
  partnerId: z.number().nullable().optional()
};

/**
 * Each kind of code requires its own amount (#038). A flat 1% minimum on every
 * code made a fixed-amount coupon impossible to save — its percentage is 0.
 */
function requireDiscountForType(
  value: { discountType?: 'percent' | 'fixed'; discountPercent: number; discountAmount?: number },
  context: z.RefinementCtx
) {
  if ((value.discountType ?? 'percent') === 'fixed') {
    if (!(Number(value.discountAmount) > 0)) {
      context.addIssue({
        code: 'custom',
        path: ['discountAmount'],
        message: 'Nhập số tiền giảm lớn hơn 0'
      });
    }
    return;
  }
  if (!(value.discountPercent >= 1)) {
    context.addIssue({
      code: 'custom',
      path: ['discountPercent'],
      message: 'Giảm giá tối thiểu 1%'
    });
  }
}

export const createCouponSchema = z.object(couponFields).superRefine(requireDiscountForType);

export type CreateCouponFormValues = z.infer<typeof createCouponSchema>;

export const updateCouponSchema = z.object(couponFields).superRefine(requireDiscountForType);

export type UpdateCouponFormValues = z.infer<typeof updateCouponSchema>;

/**
 * What to send for the chosen kind of code (#038): the fields of the other kind
 * are zeroed, so a code switched from percent to fixed does not keep a stale
 * percentage or cap behind it.
 */
export function discountPayload(value: {
  discountType?: 'percent' | 'fixed';
  discountPercent: number;
  discountAmount?: number;
  maxDiscountAmount?: number | null;
}) {
  if ((value.discountType ?? 'percent') === 'fixed') {
    return {
      discountType: 'fixed' as const,
      discountPercent: 0,
      discountAmount: Number(value.discountAmount ?? 0),
      maxDiscountAmount: null
    };
  }
  return {
    discountType: 'percent' as const,
    discountPercent: value.discountPercent,
    discountAmount: 0,
    maxDiscountAmount: value.maxDiscountAmount ?? null
  };
}
