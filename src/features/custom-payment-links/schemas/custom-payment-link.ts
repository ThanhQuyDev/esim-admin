import * as z from 'zod';

export const createCustomPaymentLinkSchema = z.object({
  customer_email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
  amount: z
    .string()
    .min(1, 'Số tiền là bắt buộc')
    .refine((v) => Number.isInteger(Number(v)) && Number(v) > 0, {
      message: 'Số tiền phải là số nguyên dương (VND)'
    }),
  description: z.string().min(1, 'Mô tả là bắt buộc').max(500, 'Mô tả tối đa 500 ký tự')
});

export type CreateCustomPaymentLinkFormValues = z.infer<typeof createCustomPaymentLinkSchema>;
