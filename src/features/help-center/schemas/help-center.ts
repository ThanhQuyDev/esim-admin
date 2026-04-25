import * as z from 'zod';

const CATEGORIES = ['getting_started', 'plans_and_payments', 'troubleshooting', 'faq'] as const;
const PARENTS = [
  'setting_up',
  'using_esim',
  'device_compatibility',
  'payments',
  'plans',
  'find_an_answer',
  'esim_functions',
  'esim_basics',
  'about_esimvn'
] as const;

export const helpCenterSchema = z.object({
  title: z.string().min(2, 'Tiêu đề là bắt buộc'),
  content: z.string().min(1, 'Nội dung là bắt buộc'),
  order: z.string().optional(),
  category: z.enum(CATEGORIES),
  parent: z.enum(PARENTS)
});

export type HelpCenterFormValues = z.infer<typeof helpCenterSchema>;
