import { z } from 'zod';

export const providerDepositEntrySchema = z.object({
  provider: z.string().min(1, 'Chọn nhà cung cấp'),
  type: z.enum(['deposit', 'adjustment', 'reconciliation']),
  amountVnd: z.string(),
  reportedBalanceVnd: z.string(),
  occurredAt: z.string(),
  note: z.string()
});

export type ProviderDepositEntryFormValues = z.infer<typeof providerDepositEntrySchema>;
