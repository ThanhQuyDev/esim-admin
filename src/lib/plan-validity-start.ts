/** "Thời điểm bắt đầu tính gói", worked out per supplier by the API (vande-0411 #026). */
export type PlanValidityStart = 'first_connection' | 'installation' | 'purchase' | 'pre_arrival';

const LABELS: Record<PlanValidityStart, string> = {
  first_connection: 'Khi đến nơi và kết nối mạng lần đầu',
  installation: 'Khi cài đặt eSIM',
  purchase: 'Ngay khi mua hàng',
  pre_arrival: 'Bắt buộc cài đặt eSIM trước khi đến nơi'
};

export const VALIDITY_START_TITLE = 'Thời điểm bắt đầu tính gói';

/** "Chưa có thông tin" until the supplier's next sync has said. */
export function validityStartLabel(
  plan: { validityStart?: PlanValidityStart | null } | null | undefined
): string {
  return plan?.validityStart ? LABELS[plan.validityStart] : 'Chưa có thông tin';
}
