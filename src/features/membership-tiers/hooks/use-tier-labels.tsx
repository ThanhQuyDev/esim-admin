'use client';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { membershipTiersQueryOptions } from '../api/queries';
import type { MembershipTier, MembershipTierCode } from '../api/types';

/**
 * Names of the built-in tiers, for the moment before the ladder has loaded and
 * for orders placed under a tier that was later removed (vande #066).
 */
const BUILT_IN_NAMES: Record<string, string> = {
  traveler: 'Du khách',
  silver: 'Du khách bạc',
  gold: 'Du khách vàng',
  platinum: 'Du khách bạch kim'
};

const BUILT_IN_STYLES: Record<string, string> = {
  traveler: 'border-sky-200 bg-sky-50 text-sky-700',
  silver: 'border-slate-300 bg-slate-100 text-slate-700',
  gold: 'border-amber-300 bg-amber-50 text-amber-700',
  platinum: 'border-violet-300 bg-violet-50 text-violet-700'
};

/** A tier an admin added has no colour of its own. */
const ADDED_TIER_STYLE = 'border-emerald-300 bg-emerald-50 text-emerald-700';

export type TierLabels = {
  /** The ladder, lowest tier first. */
  tiers: MembershipTier[];
  label: (code: MembershipTierCode | null | undefined) => string;
  style: (code: MembershipTierCode | null | undefined) => string;
  /** For filters and selects, lowest tier first. */
  options: { value: string; label: string }[];
};

/**
 * Tier names as the admin set them in "Hạng khách hàng", so every screen says
 * the same thing and a tier added there shows up everywhere (vande #066).
 */
export function useTierLabels(): TierLabels {
  const { data: tiers = [] } = useQuery(membershipTiersQueryOptions());
  return useMemo(() => {
    const names = new Map(tiers.map((t) => [t.tier, t.name]));
    const label = (code: MembershipTierCode | null | undefined) =>
      code ? (names.get(code) ?? BUILT_IN_NAMES[code] ?? code) : '—';
    const style = (code: MembershipTierCode | null | undefined) =>
      (code && BUILT_IN_STYLES[code]) || ADDED_TIER_STYLE;
    const options = (tiers.length ? tiers.map((t) => t.tier) : Object.keys(BUILT_IN_NAMES)).map(
      (value) => ({ value, label: label(value) })
    );
    return { tiers, label, style, options };
  }, [tiers]);
}

/** A tier as a coloured badge. */
export function TierBadge({ tier }: { tier: MembershipTierCode }) {
  const { label, style } = useTierLabels();
  return (
    <Badge variant='outline' className={style(tier)}>
      {label(tier)}
    </Badge>
  );
}
