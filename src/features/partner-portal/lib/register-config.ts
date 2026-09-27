/**
 * What the application form needs to know about partner types (#002).
 *
 * The earlier version carried per-type copy for six labels plus eight dropdown
 * vocabularies (order ranges, audience sizes, integration timelines…). The form
 * no longer asks any of that, so only the type itself survives here.
 */
import type { PartnerType } from '../api/types';

/** The portal offers three models; the API stores two. */
export type ApplyPartnerType = 'marketing' | 'distribution' | 'api';

/**
 * API integration partners buy stock the same way distributors do, so the API
 * files them under `distribution`; the applicant's own answer is kept in
 * `channelInfo.model`.
 */
export function toApiPartnerType(type: ApplyPartnerType): PartnerType {
  return type === 'marketing' ? 'kol' : 'distribution';
}
