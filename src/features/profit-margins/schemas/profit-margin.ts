import * as z from 'zod';

export const profitMarginTierSchema = z
  .object({
    minVnd: z.string().min(1, 'Min price is required'),
    maxVnd: z.string().min(1, 'Max price is required'),
    percentage: z.string().min(1, 'Percentage is required'),
    isActive: z.boolean()
  })
  .refine(
    (data) => {
      const min = Number(data.minVnd);
      const max = Number(data.maxVnd);
      if (isNaN(min) || isNaN(max)) return true; // let other validations catch NaN
      return min <= max;
    },
    {
      message: 'Min price must be less than or equal to Max price',
      path: ['maxVnd']
    }
  );

export type ProfitMarginTierFormValues = z.infer<typeof profitMarginTierSchema>;
