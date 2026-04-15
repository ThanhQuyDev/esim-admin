import * as z from 'zod';

export const createPlanSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  provider: z.string().optional(),
  providerPlanId: z.string().optional(),
  slug: z.string().optional(),
  countryCode: z.string().optional(),
  destinationId: z.string().optional(),
  regionId: z.string().optional(),
  durationDays: z.string().optional(),
  dataGb: z.string().optional(),
  sms: z.string().optional(),
  call: z.string().optional(),
  costPrice: z.string().optional(),
  price: z.string().optional(),
  retailPrice: z.string().optional(),
  currency: z.string().optional(),
  type: z.string().optional(),
  topUp: z.boolean().optional(),
  isActive: z.boolean().optional()
});

export type CreatePlanFormValues = z.infer<typeof createPlanSchema>;

export const updatePlanSchema = createPlanSchema;

export type UpdatePlanFormValues = z.infer<typeof updatePlanSchema>;
