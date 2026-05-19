import * as z from 'zod';

const numericString = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === 'number' ? v : v.trim() === '' ? NaN : Number(v)));

export const createCustomPaymentLinkSchema = z.object({
  customer_email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
  amount: numericString.pipe(
    z
      .number({ message: 'Số tiền là bắt buộc' })
      .int('Số tiền phải là số nguyên')
      .positive('Số tiền phải lớn hơn 0')
  ),
  description: z.string().min(1, 'Mô tả là bắt buộc').max(500, 'Mô tả tối đa 500 ký tự')
});

// Form input type — what defaultValues / FormTextField produce.
// (z.infer would give the OUTPUT type after transform; we need the INPUT type.)
export type CreateCustomPaymentLinkFormValues = {
  customer_email: string;
  amount: string | number;
  description: string;
};
