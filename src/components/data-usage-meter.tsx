import { cn } from '@/lib/utils';

/** "1.5 GB", "50 MB": what the meters print. */
export function formatMb(mb: number): string {
  if (mb >= 1024) return `${parseFloat((mb / 1024).toFixed(2))} GB`;
  return `${Math.round(mb)} MB`;
}

/**
 * A plan whose data has no cap, so its total reads "∞" (vande-1411 #044): a
 * plain unlimited plan, or any unlimited kind the supplier gives no total for.
 * An "unlimited-reduce" plan with a total shows that high-speed allowance.
 */
export function isUnlimitedPlanType(
  type: string | null | undefined,
  totalMb?: number | null
): boolean {
  if (type === 'unlimited') return true;
  return /unlimited/i.test(type ?? '') && !(Number(totalMb) > 0);
}

/**
 * Data used with a bar, on every screen that shows it (vande-1411 #044):
 * "24 MB / 2 GB" with how much of the cap is gone, or "100 MB / ∞" with a full
 * pale bar for an unlimited plan — it used to read "0.05 / " with no bar.
 * `total` null and not unlimited: the supplier has not said, so "—".
 */
export function DataUsageMeter({
  usedMb,
  totalMb,
  unlimited,
  className,
  testId = 'data-usage-meter'
}: {
  usedMb: number | null | undefined;
  totalMb: number | null | undefined;
  unlimited: boolean;
  className?: string;
  testId?: string;
}) {
  const used = Math.max(0, Number(usedMb) || 0);
  const total = Number(totalMb) || 0;
  const capped = !unlimited && total > 0;
  const percent = capped ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const text = unlimited
    ? `${formatMb(used)} / ∞`
    : capped
      ? `${formatMb(used)} / ${formatMb(total)}`
      : usedMb == null
        ? '—'
        : `${formatMb(used)} / —`;
  const bar = percent > 80 ? 'bg-red-500' : percent > 50 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className={cn('flex min-w-[7rem] flex-col gap-1', className)} data-testid={testId}>
      <span className='text-xs whitespace-nowrap tabular-nums'>
        {text}
        {capped && <span className='text-muted-foreground'> · {percent}%</span>}
      </span>
      {(unlimited || capped) && (
        <div
          className={cn(
            'h-1.5 w-full overflow-hidden rounded-full',
            unlimited ? 'bg-indigo-100 dark:bg-indigo-950' : 'bg-muted'
          )}
          role='progressbar'
          aria-valuenow={unlimited ? undefined : percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={unlimited ? 'Không giới hạn' : `Đã dùng ${percent}%`}
        >
          <div
            className={cn('h-full rounded-full', unlimited ? 'w-full bg-indigo-300' : bar)}
            style={unlimited ? undefined : { width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
}
