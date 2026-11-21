import * as z from 'zod';

export const NOTE_LANGUAGE_OPTIONS = [
  { value: 'vi', label: 'Vietnamese' },
  { value: 'en', label: 'English' }
] as const;

/**
 * What a note applies to (vande-2011 #031): one brand, or a whole device
 * category — the note then shows under that tab's lead line.
 */
export const NOTE_SCOPE_OPTIONS = [
  { value: 'brand', label: 'Một hãng' },
  { value: 'Smart Phones', label: 'Danh mục: Điện thoại' },
  { value: 'Smart Watches', label: 'Danh mục: Đồng hồ thông minh' },
  { value: 'Tablets', label: 'Danh mục: Máy tính bảng' },
  { value: 'Laptops', label: 'Danh mục: Máy tính xách tay' }
] as const;

export const noteScopeLabel = (deviceType: string | null | undefined) =>
  NOTE_SCOPE_OPTIONS.find((o) => o.value === deviceType)?.label ?? null;

export const manufacturerNoteSchema = z.object({
  scope: z.string().min(1),
  manufacturer: z.string().max(255, 'Tên hãng quá dài'),
  language: z.string().min(1, 'Chọn ngôn ngữ'),
  note: z.string().min(1, 'Nhập nội dung ghi chú'),
  isActive: z.boolean().optional(),
  /** Position among the brand's notes (vande #042); typed as text in the box. */
  sortOrder: z.union([z.string(), z.number()]).optional()
});

export const manufacturerNoteFormSchema = manufacturerNoteSchema.refine(
  (v) => v.scope !== 'brand' || v.manufacturer.trim().length > 0,
  { message: 'Chọn hãng', path: ['manufacturer'] }
);

export type ManufacturerNoteFormValues = z.infer<typeof manufacturerNoteSchema>;
