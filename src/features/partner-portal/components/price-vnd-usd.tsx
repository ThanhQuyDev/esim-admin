import { formatVnd } from '@/lib/format';

/** `$4.32` — the dollar figure the API already rounded to the cent. */
export function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * A price in đồng with the same price in dollars on the line below (vande
 * #055), for partners who quote customers abroad.
 */
export function PriceVndUsd({ vnd, usd }: { vnd: number; usd?: number | null }) {
  return (
    <>
      <span className='block'>{formatVnd(vnd)}</span>
      {usd != null && (
        <span className='text-muted-foreground block text-xs font-normal' data-testid='price-usd'>
          {formatUsd(usd)}
        </span>
      )}
    </>
  );
}
