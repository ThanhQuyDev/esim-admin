import type { OverviewProvider } from './types';

/**
 * Providers the backend reports on (`src/overview/dto/overview.dto.ts`).
 * Single source of truth for the overview filter, the dashboard badge and the
 * chart labels — keep in sync with the backend enum when a provider is added.
 */
export const OVERVIEW_PROVIDERS = [
  'airalo',
  'esimaccess',
  'gadgetkorea',
  'microesim',
  'billion',
  'viettel',
  // Domestic eSIMs are suppliers of their own, "<carrier> nội địa" (vande
  // #001): Viettel's domestic plans no longer count as its travel plans. An
  // order for them was missing from the overview before (#063, test round 4).
  'viettel-noidia',
  'itel-noidia',
  'wintel-noidia',
  'vnsky-noidia'
] as const satisfies readonly OverviewProvider[];

/**
 * Real supplier names. Used everywhere in the CMS EXCEPT the Tổng quan screen —
 * an admin managing plans, orders or supplier deposits still has to know who is
 * who. See {@link providerCodeLabel} for the masked variant.
 */
export const PROVIDER_LABELS: Record<string, string> = {
  airalo: 'Airalo',
  esimaccess: 'eSIM Access',
  gadgetkorea: 'Gadget Korea',
  microesim: 'MicroEsim',
  billion: 'Billion Connect',
  viettel: 'Viettel',
  'viettel-noidia': 'Viettel nội địa',
  'itel-noidia': 'iTel nội địa',
  'wintel-noidia': 'Wintel nội địa',
  'vnsky-noidia': 'VNSKY nội địa',
  // Domestic stock imported before vande #001 carried the bare carrier.
  itel: 'iTel'
};

/**
 * Display name of any supplier slug. A domestic carrier added later by an
 * import ("mobifone-noidia") still reads "Mobifone nội địa" without a code
 * change.
 */
export function providerLabel(provider: string | null | undefined): string {
  const slug = (provider ?? '').toLowerCase();
  if (!slug) return '—';
  if (PROVIDER_LABELS[slug]) return PROVIDER_LABELS[slug];
  const domestic = slug.match(/^(.+)-noidia$/);
  if (domestic) {
    const carrier = domestic[1];
    const base = PROVIDER_LABELS[carrier] ?? carrier.charAt(0).toUpperCase() + carrier.slice(1);
    return `${base} nội địa`;
  }
  return provider ?? slug;
}

/**
 * Masked supplier codes, shown ONLY on the Tổng quan screen so the dashboard
 * can be opened, screenshared or screenshotted without revealing which
 * wholesalers esim.vn buys from.
 *
 * Short abbreviations rather than numbered codes: "NCC-01…NCC-07" could not be
 * told apart at a glance. The codes are the ones the business confirmed (#008).
 * Change only the values — the keys (provider slugs) are what the API sends and
 * expects back.
 */
export const PROVIDER_CODE_LABELS: Record<string, string> = {
  airalo: 'AI',
  esimaccess: 'EA',
  gadgetkorea: 'GK',
  microesim: 'MI',
  billion: 'BL',
  viettel: 'VT',
  'viettel-noidia': 'VT-ND',
  'itel-noidia': 'IT-ND',
  'wintel-noidia': 'WT-ND',
  'vnsky-noidia': 'VS-ND',
  itel: 'IT'
};

/**
 * Masked label for one supplier on the overview screen.
 *
 * A supplier missing from the map falls back to a generic code rather than to
 * its slug: leaking the name is the one outcome this function exists to
 * prevent. Several unknown suppliers therefore share one label, which is the
 * visible cue to add them to {@link PROVIDER_CODE_LABELS}.
 */
export function providerCodeLabel(provider: string): string {
  return PROVIDER_CODE_LABELS[provider] ?? (provider.endsWith('-noidia') ? 'ND-KHÁC' : 'NCC-KHÁC');
}
