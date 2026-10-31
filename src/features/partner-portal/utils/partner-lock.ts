/**
 * Why a locked partner cannot do something (doitac-3010 #009), or null when
 * they can. "Tạm khoá" and "Khoá tài khoản" freeze the money and stop new
 * links, codes and withdrawals; the button says so before the partner fills
 * in a form the server would refuse.
 */
export function partnerLockMessage(
  status: string | null | undefined,
  action: 'link' | 'coupon' | 'payout'
): string | null {
  if (status !== 'hold' && status !== 'disabled') return null;
  switch (action) {
    case 'link':
      return 'Tài khoản đang bị tạm khoá nên không thể tạo thêm liên kết mới. Vui lòng liên hệ admin để được hỗ trợ.';
    case 'coupon':
      return 'Tài khoản đang bị tạm khoá nên không thể tạo thêm mã giảm giá mới. Vui lòng liên hệ admin để được hỗ trợ.';
    default:
      return 'Tài khoản đang bị tạm khoá, số tiền hoa hồng đang bị đóng băng nên chưa thể tạo yêu cầu rút tiền. Vui lòng liên hệ admin để được hỗ trợ.';
  }
}

/** The account status as the partner reads it on their profile. */
export function partnerStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'active':
      return 'Đã xác minh';
    case 'hold':
      return 'Tạm khóa tài khoản';
    case 'disabled':
      return 'Khóa tài khoản';
    case 'rejected':
      return 'Bị từ chối';
    default:
      return 'Đang chờ duyệt';
  }
}
