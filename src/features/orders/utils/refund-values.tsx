import { cn } from '@/lib/utils';

/**
 * An order's money after its refunds (#009, test round 4): what the customer
 * paid (cash + eXU) less what was given back, and the USD total scaled to the
 * same share. The original figures stay alongside, struck through.
 */
export function orderValuesAfterRefund(order: {
  totalAmount: number | string;
  vndPrice: number | string;
  payableVndPrice?: number | string | null;
  walletSpentVndAmount?: number | string | null;
  refundedAmountVnd?: number | string | null;
}) {
  // Cash (`payableVndPrice`, the same on every kind of order) + eXU.
  const originalVnd =
    Number(order.payableVndPrice ?? order.vndPrice ?? 0) + Number(order.walletSpentVndAmount ?? 0);
  const refunded = Number(order.refundedAmountVnd ?? 0);
  const vnd = Math.max(originalVnd - refunded, 0);
  const originalTotal = Number(order.totalAmount ?? 0);
  const total =
    originalVnd > 0 ? Math.round((originalTotal * vnd * 100) / originalVnd) / 100 : originalTotal;
  return { originalVnd, vnd, originalTotal, total, refunded, isRefunded: refunded > 0 };
}

/** The value now, with the original greyed and struck through when it changed. */
export function ValueAfterRefund({
  value,
  original,
  format,
  className
}: {
  value: number;
  original: number;
  format: (n: number) => string;
  className?: string;
}) {
  if (value === original) return <span className={className}>{format(value)}</span>;
  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-x-1.5', className)}>
      <span>{format(value)}</span>
      <span
        className='text-muted-foreground text-xs line-through'
        title='Giá trị ban đầu, trước khi hoàn tiền'
      >
        {format(original)}
      </span>
    </span>
  );
}
