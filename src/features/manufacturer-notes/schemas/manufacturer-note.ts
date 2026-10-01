import * as z from 'zod';

export const NOTE_LANGUAGE_OPTIONS = [
  { value: 'vi', label: 'Vietnamese' },
  { value: 'en', label: 'English' }
] as const;

export const manufacturerNoteSchema = z.object({
  manufacturer: z
    .string()
    .min(1, 'Nhập tên hãng, viết giống y trong danh sách thiết bị')
    .max(255, 'Tên hãng quá dài'),
  language: z.string().min(1, 'Chọn ngôn ngữ'),
  note: z.string().min(1, 'Nhập nội dung ghi chú'),
  isActive: z.boolean().optional()
});

export type ManufacturerNoteFormValues = z.infer<typeof manufacturerNoteSchema>;
