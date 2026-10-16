/**
 * Airalo's refund request reasons (doitac-1410 #079), as its API names them,
 * with what the admin reads. Airalo reviews each request by hand and pays an
 * approved one in Airalo credit.
 */
export const AIRALO_REFUND_REASONS = [
  ['TRIP_CANCELLATION', 'Khách huỷ chuyến đi'],
  ['WRONG_PURCHASE', 'Khách mua nhầm gói'],
  ['CHANGE_OF_PLAN', 'Khách đổi gói khác'],
  ['INSTALLATION_FAILURE', 'Không cài đặt được eSIM'],
  ['QR_ISSUE_PARTNERS', 'Lỗi mã QR'],
  ['INCOMPATIBLE_DEVICE', 'Thiết bị không hỗ trợ eSIM'],
  ['LOCKED_DEVICE', 'Thiết bị bị khoá mạng'],
  ['NO_COVERAGE', 'Không có sóng'],
  ['APN_FAILURE', 'Lỗi APN'],
  ['INTERMITTENT_CONNECTION', 'Mạng chập chờn'],
  ['SLOW_SPEED', 'Tốc độ chậm'],
  ['SERVICE_DEGRADATION', 'Chất lượng dịch vụ kém'],
  ['BLOCKED_NETWORK', 'Mạng bị chặn'],
  ['HOTSPOT_NOT_WORKING', 'Không phát Wi-Fi (hotspot) được'],
  ['UNABLE_TO_ACCESS_APPS', 'Không vào được ứng dụng'],
  ['NO_VOICE_TEXT_SERVICES', 'Không gọi / nhắn tin được'],
  ['TOP_UP_PACKAGE_FAILURE', 'Nạp thêm (topup) lỗi'],
  ['EARLY_EXPIRY', 'Hết hạn sớm'],
  ['DELETED_ESIM', 'Khách lỡ xoá eSIM'],
  ['IMSI_CHANGE', 'Đổi IMSI'],
  ['OVERCHARGED', 'Bị tính tiền quá'],
  ['UNKNOWN_CHARGES', 'Phí không rõ'],
  ['OTHERS', 'Lý do khác (gửi kèm lý do hoàn tiền)']
] as const;

export type AiraloRefundReason = (typeof AIRALO_REFUND_REASONS)[number][0];

export const DEFAULT_AIRALO_REFUND_REASON: AiraloRefundReason = 'TRIP_CANCELLATION';
