import * as z from 'zod';

export const footerSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  titleVi: z.string().min(1, 'Vietnamese title is required'),
  url: z.string().min(1, 'URL is required'),
  language: z.string().min(1, 'Language is required'),
  categories: z.string().optional()
});

export type FooterFormValues = z.infer<typeof footerSchema>;
