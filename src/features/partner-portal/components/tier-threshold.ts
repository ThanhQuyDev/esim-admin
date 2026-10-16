import { formatVnd } from '@/lib/format';

import type { PartnerTier } from '../api/types';

/**
 * What earns a tier, in words (doitac-1410 #045).
 *
 * A distribution tier is reached by revenue OR by the deposit held on account
 * (#073) — either alone qualifies — and the deposit half was never shown, so a
 * threshold esim.vn entered looked missing to the partner.
 */
export function tierThresholdLabel(tier: PartnerTier, isDistribution: boolean): string {
  if (tier.isInternal) return 'Theo thỏa thuận hợp tác';
  const volume = Number(tier.minVolumeVnd) || 0;
  const deposit = isDistribution ? Number(tier.minDepositVnd) || 0 : 0;
  const parts = [
    ...(volume > 0 ? [`doanh số từ ${formatVnd(volume)}`] : []),
    ...(deposit > 0 ? [`ký quỹ từ ${formatVnd(deposit)}`] : [])
  ];
  if (parts.length === 0) return 'Mặc định khi được duyệt';
  const text = parts.join(' hoặc ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}
