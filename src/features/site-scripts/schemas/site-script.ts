import * as z from 'zod';

/**
 * Where a snippet goes. `head` is what Google's own install instructions say for
 * gtag.js and Tag Manager, so it is the default (#075).
 */
export const PLACEMENT_OPTIONS = [
  { value: 'head', label: 'Trong <head> (mặc định, dùng cho GA/GTM)' },
  { value: 'bodyEnd', label: 'Cuối <body> (không chặn hiển thị)' }
] as const;

export const siteScriptSchema = z.object({
  name: z.string().min(1, 'Đặt tên để dễ nhận biết').max(255, 'Tên quá dài'),
  content: z.string().min(1, 'Dán đoạn mã script vào đây'),
  placement: z.string().min(1, 'Chọn vị trí chèn'),
  isActive: z.boolean().optional(),
  sortOrder: z
    .string()
    .optional()
    .refine(
      (v) => !v || (Number.isInteger(Number(v)) && Number(v) >= 0),
      'Thứ tự phải là số nguyên không âm'
    )
});

export type SiteScriptFormValues = z.infer<typeof siteScriptSchema>;
