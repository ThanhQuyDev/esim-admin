import * as z from 'zod';

export const topBarSchema = z.object({
  icon: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  buttonContent: z.string().min(1, 'Button content is required'),
  language: z.string().min(1, 'Language is required'),
  url: z.string().min(1, 'URL is required')
});

export type TopBarFormValues = z.infer<typeof topBarSchema>;
