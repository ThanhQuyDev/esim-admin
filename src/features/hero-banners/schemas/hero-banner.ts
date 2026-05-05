import * as z from 'zod';

export const heroBannerSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  firstIcon: z.string().optional(),
  firstContent: z.string().optional(),
  secondIcon: z.string().optional(),
  secondContent: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  language: z.string().min(1, 'Language is required'),
  active: z.boolean().optional()
});

export type HeroBannerFormValues = z.infer<typeof heroBannerSchema>;
