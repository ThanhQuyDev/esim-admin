import type {
  SaveSupportedDeviceOrderingPayload,
  SupportedDeviceBrandOrdering
} from '../api/types';

/**
 * Turns the ordering screen's edits into a save request (#047).
 *
 * Drafts are the raw text of each number box, keyed by brand name / device
 * id; a box that was never touched has no draft. Blank means "not numbered"
 * (0). Only values that differ from what was loaded are sent, so saving after
 * changing three positions writes three rows, not 340.
 */

export type OrderingDrafts = Record<string, string>;

export interface OrderingChanges {
  payload: SaveSupportedDeviceOrderingPayload;
  /** Number boxes holding something that is not a whole number ≥ 0. */
  invalid: string[];
  changeCount: number;
}

/** '' → 0; a whole number ≥ 0 → itself; anything else → null (invalid). */
export function parsePosition(raw: string): number | null {
  const text = raw.trim();
  if (text === '') return 0;
  if (!/^\d+$/.test(text)) return null;
  const value = Number(text);
  return Number.isSafeInteger(value) ? value : null;
}

export function buildOrderingChanges(
  brands: SupportedDeviceBrandOrdering[],
  brandDrafts: OrderingDrafts,
  deviceDrafts: OrderingDrafts
): OrderingChanges {
  const manufacturers: NonNullable<SaveSupportedDeviceOrderingPayload['manufacturers']> = [];
  const devices: NonNullable<SaveSupportedDeviceOrderingPayload['devices']> = [];
  const invalid: string[] = [];

  for (const brand of brands) {
    const brandDraft = brandDrafts[brand.manufacturer];
    if (brandDraft !== undefined) {
      const position = parsePosition(brandDraft);
      if (position === null) invalid.push(brand.manufacturer);
      else if (position !== (brand.manufacturerOrder ?? 0)) {
        manufacturers.push({ manufacturer: brand.manufacturer, manufacturerOrder: position });
      }
    }

    for (const device of brand.devices) {
      const deviceDraft = deviceDrafts[device.id];
      if (deviceDraft === undefined) continue;
      const position = parsePosition(deviceDraft);
      if (position === null) invalid.push(`${brand.manufacturer} – ${device.device}`);
      else if (position !== (device.sortOrder ?? 0)) {
        devices.push({ id: device.id, sortOrder: position });
      }
    }
  }

  return {
    payload: {
      ...(manufacturers.length > 0 && { manufacturers }),
      ...(devices.length > 0 && { devices })
    },
    invalid,
    changeCount: manufacturers.length + devices.length
  };
}

/** Case-insensitive brand / model search for the ordering screen. */
export function filterBrands(
  brands: SupportedDeviceBrandOrdering[],
  query: string
): SupportedDeviceBrandOrdering[] {
  const q = query.trim().toLowerCase();
  if (!q) return brands;
  return brands.filter(
    (brand) =>
      brand.manufacturer.toLowerCase().includes(q) ||
      brand.devices.some((device) => device.device.toLowerCase().includes(q))
  );
}
