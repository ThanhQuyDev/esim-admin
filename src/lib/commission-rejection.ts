/**
 * Why an affiliate order earned no commission (#041, doitac-1410 #027).
 *
 * Shown to the admin answering a complaint and to the partner who sees "Không
 * phát sinh hoa hồng", in the same words, so the two are never told different
 * things. The tax-code and bank-account reasons are no longer produced, but
 * orders refused for them before still carry them.
 */
const SAME_AS_PARTNER = 'Thông tin khách hàng trùng với thông tin của đối tác';

const REASONS: Record<string, string> = {
  self_account: 'Đơn do chính tài khoản của đối tác đặt (tự giới thiệu).',
  self_email: `${SAME_AS_PARTNER}: email khách nhập trùng email đăng ký của đối tác.`,
  self_phone: `${SAME_AS_PARTNER}: số điện thoại khách nhập trùng số đăng ký của đối tác.`,
  self_tax_code: `${SAME_AS_PARTNER}: mã số thuế trên hoá đơn trùng mã số thuế của đối tác.`,
  self_bank_account: `${SAME_AS_PARTNER}: trùng tài khoản ngân hàng nhận hoa hồng của đối tác.`
};

export function commissionRejectionText(reason?: string | null): string | null {
  if (!reason) return null;
  return REASONS[reason] ?? `Hệ thống loại hoa hồng đơn này (${reason}).`;
}
