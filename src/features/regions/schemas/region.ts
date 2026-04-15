import * as z from 'zod';

export const createRegionSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  slug: z.string().optional(),
  isPopular: z.boolean().optional(),
  isActive: z.boolean().optional()
});

export type CreateRegionFormValues = z.infer<typeof createRegionSchema>;

export const updateRegionSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  slug: z.string().optional(),
  isPopular: z.boolean().optional(),
  isActive: z.boolean().optional()
});

export type UpdateRegionFormValues = z.infer<typeof updateRegionSchema>;
