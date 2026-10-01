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

/**
 * "Giờ làm mới mỗi ngày" (#063). The two policies differ in a way customers
 * notice: a rolling cycle resets at a different clock time for every customer,
 * a calendar day resets at the same moment for everyone in the supplier's
 * timezone. `''` is the third state the select needs — "nhà cung cấp chưa nêu".
 */
export const DAILY_RESET_VALUES = ['rolling_24h', 'calendar_day'] as const;
export type DailyResetPolicy = (typeof DAILY_RESET_VALUES)[number];

export const DAILY_RESET_OPTIONS: { value: DailyResetPolicy; label: string }[] = [
  { value: 'rolling_24h', label: 'Chu kỳ 24 giờ từ lúc cài eSIM' },
  { value: 'calendar_day', label: 'Theo ngày tự nhiên (đến 23:59)' }
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
  tags: z.array(z.enum(PLAN_TAG_VALUES)).optional(),
  apn: z.string().optional(),
  isNonHkIp: z.boolean().optional(),
  dailyResetPolicy: z.union([z.enum(DAILY_RESET_VALUES), z.literal('')]).optional(),
  dailyResetUtcOffset: z
    .string()
    .optional()
    .refine(
      (v) => !v || (Number.isInteger(Number(v)) && Number(v) >= -12 && Number(v) <= 14),
      'Múi giờ phải là số nguyên từ -12 đến 14'
    )
});

export type CreatePlanFormValues = z.infer<typeof createPlanSchema>;

export const updatePlanSchema = createPlanSchema;

export type UpdatePlanFormValues = z.infer<typeof updatePlanSchema>;
