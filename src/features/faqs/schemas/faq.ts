import * as z from 'zod';

const LANG_OPTIONS = ['vi', 'en'] as const;

export const faqSchema = z.object({
  question: z.string().min(2, 'Question is required'),
  answer: z.string().min(1, 'Answer is required'),
  language: z.enum(LANG_OPTIONS),
  sortOrder: z.string().optional(),
  isActive: z.boolean().optional()
});

export type FaqFormValues = z.infer<typeof faqSchema>;
