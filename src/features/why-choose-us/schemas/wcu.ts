import * as z from 'zod';

const LANG_OPTIONS = ['vi', 'en'] as const;

export const wcuSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  language: z.enum(LANG_OPTIONS),
  icon: z.string().optional(),
  sortOrder: z.string().optional(),
  isActive: z.boolean().optional()
});

export type WcuFormValues = z.infer<typeof wcuSchema>;
