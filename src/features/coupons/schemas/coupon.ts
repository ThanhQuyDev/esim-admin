import * as z from 'zod';

export const createCouponSchema = z.object({
  code: z.string().min(2, 'Mã coupon phải có ít nhất 2 ký tự'),
  discountPercent: z.number().min(1, 'Giảm giá tối thiểu 1%').max(100, 'Giảm giá tối đa 100%'),
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
});

export type CreateCouponFormValues = z.infer<typeof createCouponSchema>;

export const updateCouponSchema = z.object({
  code: z.string().min(2, 'Mã coupon phải có ít nhất 2 ký tự'),
  discountPercent: z.number().min(1, 'Giảm giá tối thiểu 1%').max(100, 'Giảm giá tối đa 100%'),
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
});

export type UpdateCouponFormValues = z.infer<typeof updateCouponSchema>;
