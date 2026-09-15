import { z } from 'zod';

/**
 * Read a hand-typed VND amount. VND has no decimals, so every separator an
 * admin may type is dropped — "78,330,000", "78.330.000" and "78 330 000" all
 * read as 78330000 — and a leading "-" keeps an adjustment negative.
 * Returns null when there are no digits at all.
 */
export function parseVndAmount(value: string | number): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.round(value) : null;
  }
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;
  const amount = Number(digits);
  return trimmed.startsWith('-') ? -amount : amount;
}

export const providerDepositEntrySchema = z
  .object({
    provider: z.string().min(1, 'Chọn nhà cung cấp'),
    type: z.enum(['deposit', 'adjustment', 'reconciliation']),
    // Plain text, not number inputs: a number input stored a number in a
    // string field, so saving always failed validation (#006).
    amountVnd: z.string(),
    reportedBalanceVnd: z.string(),
    occurredAt: z.string(),
    note: z.string()
  })
  .superRefine((value, ctx) => {
    const reported = value.reportedBalanceVnd.trim();

    if (value.type !== 'reconciliation') {
      const amount = parseVndAmount(value.amountVnd);
      if (amount === null || amount === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['amountVnd'],
          message: 'Nhập số tiền, VD: 78,330,000'
        });
      }
    } else if (reported === '') {
      ctx.addIssue({
        code: 'custom',
        path: ['reportedBalanceVnd'],
        message: 'Nhập số dư nhà cung cấp đang báo'
      });
    }

    if (reported !== '' && parseVndAmount(reported) === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['reportedBalanceVnd'],
        message: 'Số dư không hợp lệ, VD: 42,000,000'
      });
    }
  });

export type ProviderDepositEntryFormValues = z.infer<typeof providerDepositEntrySchema>;
