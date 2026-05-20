import * as z from 'zod';

/** Allowed plan tag values (kebab-cased to match backend). */
export const PLAN_TAG_VALUES = ['popular', 'best-seller', 'new', 'hot-deal'] as const;
export type PlanTag = (typeof PLAN_TAG_VALUES)[number];

export const PLAN_TAG_OPTIONS: { value: PlanTag; label: string }[] = [
  { value: 'popular', label: 'Phổ biến' },
  { value: 'best-seller', label: 'Bán chạy' },
  { value: 'new', label: 'Mới' },
  { value: 'hot-deal', label: 'Khuyến mãi' }
];

export const createPlanSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  provider: z.string().optional(),
  providerPlanId: z.string().optional(),
  slug: z.string().optional(),
  countryCode: z.string().optional(),
  destinationId: z.string().optional(),
  regionId: z.string().optional(),
  durationDays: z.string().optional(),
  dataMb: z.string().optional(),
  sms: z.string().optional(),
  call: z.string().optional(),
  costPrice: z.string().optional(),
  price: z.string().optional(),
  retailPrice: z.string().optional(),
  currency: z.string().optional(),
  type: z.string().optional(),
  topUp: z.boolean().optional(),
  isActive: z.boolean().optional(),
  tags: z.array(z.enum(PLAN_TAG_VALUES)).optional()
});

export type CreatePlanFormValues = z.infer<typeof createPlanSchema>;

export const updatePlanSchema = createPlanSchema;

export type UpdatePlanFormValues = z.infer<typeof updatePlanSchema>;
