import * as z from 'zod';

const LANG_OPTIONS = ['vi', 'en'] as const;

export const blogSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  author: z.string().min(1, 'Author is required'),
  language: z.enum(LANG_OPTIONS),
  slug: z.string().optional(),
  tags: z.string().optional(),
  excerpt: z.string().optional(),
  isPublished: z.boolean().optional()
});

export type BlogFormValues = z.infer<typeof blogSchema>;
