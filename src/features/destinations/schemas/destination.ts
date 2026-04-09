import * as z from 'zod';

export const createDestinationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  countryCode: z
    .string()
    .min(2, 'Country code must be 2 characters')
    .max(3, 'Country code must be at most 3 characters'),
  slug: z.string().optional(),
  isPopular: z.boolean().optional(),
  isActive: z.boolean().optional(),
  description: z.string().optional()
});

export type CreateDestinationFormValues = z.infer<typeof createDestinationSchema>;

export const updateDestinationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  countryCode: z
    .string()
    .min(2, 'Country code must be 2 characters')
    .max(3, 'Country code must be at most 3 characters'),
  slug: z.string().optional(),
  isPopular: z.boolean().optional(),
  isActive: z.boolean().optional(),
  description: z.string().optional()
});

export type UpdateDestinationFormValues = z.infer<typeof updateDestinationSchema>;
