import * as z from 'zod';

export const createInvoiceSchema = z.object({
  companyName: z
    .string()
    .min(1, 'Tên công ty là bắt buộc')
    .max(255, 'Tên công ty tối đa 255 ký tự'),
  taxCode: z.string().min(1, 'Mã số thuế là bắt buộc').max(32, 'Mã số thuế tối đa 32 ký tự'),
  address: z.string().min(1, 'Địa chỉ là bắt buộc').max(500, 'Địa chỉ tối đa 500 ký tự'),
  invoiceEmail: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ')
});

export type CreateInvoiceFormValues = z.infer<typeof createInvoiceSchema>;

export const submitManualOrderSchema = z.object({
  email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
  packageCode: z.string().min(1, 'Package code là bắt buộc'),
  slug: z.string().min(1, 'Slug là bắt buộc'),
  quantity: z
    .string()
    .min(1, 'Số lượng là bắt buộc')
    .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 1, {
      message: 'Số lượng phải là số nguyên >= 1'
    })
});

export type SubmitManualOrderFormValues = z.infer<typeof submitManualOrderSchema>;
