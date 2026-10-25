import type { AnnouncementAudience, AnnouncementPeriod } from './api/types';

/** "Nhóm khách hàng" (vande #072). */
export const AUDIENCE_OPTIONS: { value: AnnouncementAudience; label: string; hint: string }[] = [
  {
    value: 'new',
    label: 'Khách hàng mới',
    hint: 'Đã đăng nhập bằng OTP hoặc tạo tài khoản, nhưng chưa từng đặt đơn mua hàng.'
  },
  {
    value: 'purchased',
    label: 'Khách hàng đã mua hàng thành công',
    hint: 'Có ít nhất 1 đơn mua thành công (kể cả khách từng có đơn lỗi).'
  },
  {
    value: 'failed',
    label: 'Khách hàng có đơn mua bị lỗi',
    hint: 'Có đơn ở trạng thái "failed" và chưa từng mua thành công.'
  }
];

/** "Khoảng thời gian" (vande #072). */
export const PERIOD_OPTIONS: { value: AnnouncementPeriod; label: string }[] = [
  { value: 'last_7_days', label: 'Trong 7 ngày qua' },
  { value: 'last_14_days', label: 'Trong 14 ngày qua' },
  { value: 'last_30_days', label: 'Trong 30 ngày qua' },
  { value: 'last_week', label: 'Tuần trước' },
  { value: 'last_month', label: 'Tháng trước' },
  { value: 'last_60_days', label: 'Trong vòng 60 ngày qua' },
  { value: 'last_90_days', label: 'Trong vòng 90 ngày qua' },
  { value: 'last_6_months', label: 'Trong vòng 6 tháng qua' },
  { value: 'last_12_months', label: 'Trong vòng 12 tháng qua' },
  { value: 'all_time', label: 'Từ trước tới nay' }
];

export const AUDIENCE_LABEL = Object.fromEntries(
  AUDIENCE_OPTIONS.map((o) => [o.value, o.label])
) as Record<AnnouncementAudience, string>;

export const PERIOD_LABEL = Object.fromEntries(
  PERIOD_OPTIONS.map((o) => [o.value, o.label])
) as Record<AnnouncementPeriod, string>;
