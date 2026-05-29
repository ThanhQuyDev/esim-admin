import * as z from 'zod';

const CATEGORIES = ['getting-started', 'plans-and-payments', 'troubleshooting', 'faq'] as const;
const PARENTS = [
  'setting-up',
  'using-esim',
  'device-compatibility',
  'payments',
  'plans',
  'find-an-answer',
  'esim-functions',
  'esim-basics',
  'about-esimvn'
] as const;
const LANG_OPTIONS = ['vi', 'en'] as const;

export const helpCenterSchema = z.object({
  title: z.string().min(2, 'Tiêu đề là bắt buộc'),
  content: z.string().min(1, 'Nội dung là bắt buộc'),
  order: z.string().optional(),
  category: z.enum(CATEGORIES),
  parent: z.enum(PARENTS),
  language: z.enum(LANG_OPTIONS).optional(),
  slug: z.string().optional(),
  isPublished: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional()
});

export type HelpCenterFormValues = z.infer<typeof helpCenterSchema>;
