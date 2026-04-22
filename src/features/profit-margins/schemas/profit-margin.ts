import * as z from 'zod';

export const profitMarginSchema = z.object({
  name: z.string().min(1, 'Tên là bắt buộc'),
  percentage: z
    .string()
    .min(1, 'Phần trăm là bắt buộc')
    .refine((v) => !isNaN(Number(v)), 'Phải là số')
    .refine((v) => Number(v) >= 0, 'Phần trăm phải >= 0'),
  isActive: z.boolean()
});

export type ProfitMarginFormValues = z.infer<typeof profitMarginSchema>;
