/**
 * Plan name with its call / SMS allowance spelled out (#008).
 *
 * "United States 1GB - 10Mins - 10SMS / 7day": an admin looking at an order or
 * at the eSIM list has to be able to tell a call/SMS eSIM from a data-only one
 * without opening the plan.
 *
 * The allowance is DECORATED onto the stored name rather than written into it.
 * `plan.name` comes from each supplier's own catalogue and is rewritten on every
 * sync, so anything appended to the column would be lost on the next run — and
 * would differ per supplier in the meantime.
 */

export type PlanLabelSource = {
  name?: string | null;
  /** Call minutes included, if any. */
  call?: number | null;
  /** SMS included, if any. */
  sms?: number | null;
  durationDays?: number | null;
};

/** True when the name already states the duration, in any of the shapes
 *  suppliers use: "7 days", "7day", "/7d", "- 30 ngày". */
function mentionsDuration(name: string, days: number): boolean {
  return new RegExp(`\\b${days}\\s*(?:d|day|days|ngay|ngày)\\b`, 'i').test(name);
}

/**
 * @param plan  the plan (or an order item's plan), whatever of it is loaded
 * @param fallback shown when the plan has no name at all
 */
export function planDisplayName(plan: PlanLabelSource | null | undefined, fallback = '—'): string {
  const base = plan?.name?.trim();
  if (!base) return fallback;

  const parts = [base];

  // 0 and null both mean "no allowance": a data-only plan must not read
  // "- 0Mins - 0SMS".
  const minutes = Number(plan?.call) || 0;
  const sms = Number(plan?.sms) || 0;
  if (minutes > 0) parts.push(`${minutes}Mins`);
  if (sms > 0) parts.push(`${sms}SMS`);

  const label = parts.join(' - ');

  const days = Number(plan?.durationDays) || 0;
  // Most supplier names already carry the duration; appending it again would
  // read "Japan 5GB - 7 days - 10Mins / 7day".
  if (days > 0 && !mentionsDuration(base, days)) {
    return `${label} / ${days}day`;
  }
  return label;
}

/** True when the plan includes minutes or SMS, for a "Có / Không" badge. */
export function hasCallOrSms(plan: PlanLabelSource | null | undefined): boolean {
  return (Number(plan?.call) || 0) > 0 || (Number(plan?.sms) || 0) > 0;
}

/** "10 phút gọi · 10 SMS", or null for a data-only plan. */
export function callSmsSummary(plan: PlanLabelSource | null | undefined): string | null {
  const minutes = Number(plan?.call) || 0;
  const sms = Number(plan?.sms) || 0;
  const parts: string[] = [];
  if (minutes > 0) parts.push(`${minutes} phút gọi`);
  if (sms > 0) parts.push(`${sms} SMS`);
  return parts.length > 0 ? parts.join(' · ') : null;
}

/** "Cố định" / "Theo ngày" / "Không giới hạn" / "Không giới hạn giảm tốc" (vande #024). */
export const PLAN_TYPE_LABELS: Record<string, string> = {
  fixed: 'Cố định',
  'data-in-total': 'Cố định',
  month: 'Theo tháng',
  daily: 'Theo ngày',
  'daily-limit-service-cutoff': 'Theo ngày',
  unlimited: 'Không giới hạn',
  'unlimited-reduce': 'Không giới hạn giảm tốc'
};

export function planTypeLabel(type: string | null | undefined): string | null {
  return type ? (PLAN_TYPE_LABELS[type] ?? type) : null;
}

const DAILY_TYPES = ['daily', 'daily-limit-service-cutoff', 'unlimited-reduce'];

/** Whether the allowance is per day. */
export function isDailyPlanType(type: string | null | undefined): boolean {
  return !!type && DAILY_TYPES.includes(type);
}

/**
 * "Giờ làm mới mỗi ngày" (#063): "Sau mỗi 24 giờ" for a rolling cycle,
 * "23:59 (UTC+8)" for the supplier's calendar day. Null for a plan with no
 * daily allowance, or when the supplier has not said.
 */
export function dailyResetText(
  plan:
    | {
        type?: string | null;
        dailyResetPolicy?: string | null;
        /** Hours east of UTC. */
        dailyResetUtcOffset?: number | null;
      }
    | null
    | undefined
): string | null {
  if (!plan || !isDailyPlanType(plan.type)) return null;
  if (plan.dailyResetPolicy === 'rolling_24h') return 'Sau mỗi 24 giờ';
  if (plan.dailyResetPolicy === 'calendar_day') {
    const offset = plan.dailyResetUtcOffset;
    if (offset === null || offset === undefined) return '23:59';
    return `23:59 (UTC${offset >= 0 ? '+' : '-'}${Math.abs(offset)})`;
  }
  return null;
}
