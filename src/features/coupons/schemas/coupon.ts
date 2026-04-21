import * as z from 'zod';

export const createCouponSchema = z.object({
  code: z.string().min(2, 'Mã coupon phải có ít nhất 2 ký tự'),
  discountPercent: z.number().min(1, 'Giảm giá tối thiểu 1%').max(100, 'Giảm giá tối đa 100%'),
  maxUsage: z.number().min(1, 'Số lần sử dụng tối thiểu là 1'),
  maxUsagePerUser: z.number().min(1, 'Số lần sử dụng/người tối thiểu là 1'),
  minOrderAmount: z.number().min(0, 'Giá trị đơn hàng tối thiểu không được âm'),
  expiresAt: z.string().min(1, 'Ngày hết hạn là bắt buộc'),
  isActive: z.boolean().optional()
});

export type CreateCouponFormValues = z.infer<typeof createCouponSchema>;

export const updateCouponSchema = z.object({
  code: z.string().min(2, 'Mã coupon phải có ít nhất 2 ký tự'),
  discountPercent: z.number().min(1, 'Giảm giá tối thiểu 1%').max(100, 'Giảm giá tối đa 100%'),
  maxUsage: z.number().min(1, 'Số lần sử dụng tối thiểu là 1'),
  maxUsagePerUser: z.number().min(1, 'Số lần sử dụng/người tối thiểu là 1'),
  minOrderAmount: z.number().min(0, 'Giá trị đơn hàng tối thiểu không được âm'),
  expiresAt: z.string().min(1, 'Ngày hết hạn là bắt buộc'),
  isActive: z.boolean().optional()
});

export type UpdateCouponFormValues = z.infer<typeof updateCouponSchema>;
