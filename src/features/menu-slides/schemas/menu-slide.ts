import * as z from 'zod';

/**
 * The four mega-menu panels on the storefront. These keys are the panel names the
 * navbar itself uses, so a slide lands in the panel the admin picked (#073).
 */
export const MENU_KEY_OPTIONS = [
  { value: 'product', label: 'Sản phẩm (Product)' },
  { value: 'resources', label: 'Tài nguyên (Resources)' },
  { value: 'offers', label: 'Ưu đãi (Offers)' },
  { value: 'help', label: 'Trợ giúp (Help)' }
] as const;

export const LANGUAGE_OPTIONS = [
  { value: 'vi', label: 'Vietnamese' },
  { value: 'en', label: 'English' }
] as const;

export const menuSlideSchema = z.object({
  menuKey: z.string().min(1, 'Chọn menu chứa slide'),
  title: z.string().min(1, 'Tiêu đề là bắt buộc').max(255, 'Tiêu đề quá dài'),
  description: z.string().min(1, 'Mô tả là bắt buộc').max(500, 'Mô tả quá dài'),
  href: z.string().min(1, 'Đường dẫn là bắt buộc'),
  // Optional here: an uploaded file lives outside the form, so requiring the URL
  // field rejected a slide whose image had just been uploaded (#048, test round
  // 4). "File or URL" is checked when the form is submitted.
  image: z.string().optional(),
  imageAlt: z.string().max(255, 'Alt quá dài').optional(),
  language: z.string().min(1, 'Chọn ngôn ngữ'),
  // Kept as text so the input can be empty; coerced before it is sent.
  // The number input hands back a number once typed in (FormTextField
  // type='number'), and a string when untouched — both are accepted (#048:
  // "Invalid input: expected string, received number").
  sortOrder: z
    .union([z.string(), z.number()])
    .optional()
    .refine(
      (v) => v === undefined || v === '' || (Number.isInteger(Number(v)) && Number(v) >= 0),
      'Thứ tự phải là số nguyên không âm'
    ),
  isActive: z.boolean().optional()
});

export type MenuSlideFormValues = z.infer<typeof menuSlideSchema>;
