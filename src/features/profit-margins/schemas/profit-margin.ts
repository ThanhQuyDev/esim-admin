import * as z from 'zod';

/**
 * Numeric field that accepts both strings (default values, empty input) and
 * numbers (TextField with type="number" emits parseFloat on change).
 * Validates that the value is non-empty and a valid finite number.
 */
const numericField = (message: string) =>
  z.union([z.string(), z.number()]).refine(
    (v) => {
      if (typeof v === 'number') return Number.isFinite(v);
      return v.trim().length > 0 && Number.isFinite(Number(v));
    },
    { message }
  );

export const profitMarginTierSchema = z
  .object({
    minVnd: numericField('Min price is required'),
    maxVnd: numericField('Max price is required'),
    percentage: numericField('Percentage is required'),
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
