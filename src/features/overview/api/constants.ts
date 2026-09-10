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
  'japantravelsim',
  'microesim',
  'billion',
  'viettel'
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
  japantravelsim: 'Japan',
  microesim: 'MicroEsim',
  billion: 'Billion Connect',
  viettel: 'Viettel'
};

/**
 * Masked supplier codes, shown ONLY on the Tổng quan screen so the dashboard
 * can be opened, screenshared or screenshotted without revealing which
 * wholesalers esim.vn buys from.
 *
 * ⚠️ These codes are PLACEHOLDERS. Replace the values with the exact names
 * from the end of Thọ's spreadsheet — the keys (provider slugs) must stay
 * exactly as they are, they are what the API sends and expects back.
 */
export const PROVIDER_CODE_LABELS: Record<string, string> = {
  airalo: 'NCC-01',
  esimaccess: 'NCC-02',
  gadgetkorea: 'NCC-03',
  japantravelsim: 'NCC-04',
  microesim: 'NCC-05',
  billion: 'NCC-06',
  viettel: 'NCC-07'
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
  return PROVIDER_CODE_LABELS[provider] ?? 'NCC-KHÁC';
}
