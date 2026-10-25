import { formatVnd } from '@/lib/format';

import type { MySummary, PartnerTier } from '../api/types';

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
    ...(volume > 0 ? [`doanh số tháng từ ${formatVnd(volume)}`] : []),
    ...(deposit > 0 ? [`ký quỹ từ ${formatVnd(deposit)}`] : [])
  ];
  if (parts.length === 0) return 'Mặc định khi được duyệt';
  const text = parts.join(' hoặc ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** `2026-10` -> `tháng 10/2026`. */
export function tierMonthLabel(period?: string | null): string {
  const [y, m] = (period ?? '').split('-');
  return y && m ? `tháng ${Number(m)}/${y}` : 'tháng này';
}

/**
 * Where this month's sales leave the partner for next month (vande #053): the
 * tier is decided on one month's revenue, so the "still missing" figures are
 * this month's, and so is staying on the current tier.
 */
export function tierMonthHints(tier: MySummary['tier'] | undefined): string[] {
  if (!tier || tier.isInternal) return [];
  const month = tierMonthLabel(tier.period);
  const hints = [
    !tier.next
      ? 'Bạn đang ở hạng cao nhất của chương trình.'
      : tier.toNextTierVnd > 0
        ? `Còn ${formatVnd(tier.toNextTierVnd)} doanh số hợp lệ trong ${month} để lên hạng ${tier.next.tierName} từ tháng sau.`
        : `Doanh số ${month} đã đạt hạng ${tier.next.tierName} — hạng mới áp dụng từ ngày 1 tháng sau.`
  ];
  if (tier.current && (tier.toKeepTierVnd ?? 0) > 0) {
    hints.push(
      `Cần thêm ${formatVnd(tier.toKeepTierVnd)} trong ${month} để giữ hạng ${tier.current.tierName} tháng sau.`
    );
  }
  return hints;
}
