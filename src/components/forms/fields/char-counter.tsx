'use client';

import { cn } from '@/lib/utils';

interface CharCounterProps {
  length: number;
  /**
   * Soft limit. Nothing is blocked at this length — it is the point past which
   * search engines start truncating, so the counter only warns.
   */
  recommendedLength?: number;
  /** Hard cap, when the input also enforces one. */
  maxLength?: number;
  className?: string;
}

/**
 * "84 / 160 ký tự" under a text input (#048).
 *
 * Meta title and description have no technical maximum — Google simply cuts them
 * off — so a hard `maxLength` would stop an editor mid-sentence for no reason.
 * The counter turns amber as the limit approaches and red past it instead.
 */
export function CharCounter({ length, recommendedLength, maxLength, className }: CharCounterProps) {
  const limit = recommendedLength ?? maxLength;
  const over = limit != null && length > limit;
  const near = limit != null && !over && length >= Math.floor(limit * 0.9);

  return (
    <div
      className={cn(
        'text-right text-xs tabular-nums',
        over ? 'text-destructive' : near ? 'text-amber-600' : 'text-muted-foreground',
        className
      )}
    >
      {length}
      {limit != null ? ` / ${limit}` : ''} ký tự
    </div>
  );
}
