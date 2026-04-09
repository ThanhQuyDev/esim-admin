import * as z from 'zod';

export const createRegionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().optional(),
  isActive: z.boolean().optional()
});

export type CreateRegionFormValues = z.infer<typeof createRegionSchema>;

export const updateRegionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().optional(),
  isActive: z.boolean().optional()
});

export type UpdateRegionFormValues = z.infer<typeof updateRegionSchema>;
