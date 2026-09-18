/**
 * Navigation, page headings and role wording for the partner portal.
 *
 * Every string here is copied from cong-doi-tac-phan-phoi-hoan-chinh-v29.html
 * (`titles`, `marketingNavLabels`, `partnerRoleConfigs`). The mockup drives its
 * views from a `data-view` attribute; here each view id maps to a real route,
 * and the id stays the key so the two can be diffed against each other.
 */
import type { PartnerType } from '../api/types';

export type PortalViewId =
  | 'dashboard'
  | 'links'
  | 'coupons'
  | 'orders'
  | 'commissions'
  | 'payout'
  | 'brand'
  | 'tier'
  | 'tier-rules'
  | 'profile'
  | 'support';

/**
 * The mockup calls the affiliate role "marketing"; the API calls the same
 * partner `kol`. One name per concept, translated at this boundary only.
 */
export type PortalRole = 'marketing' | 'distribution';

export function roleFromPartnerType(partnerType: PartnerType | undefined): PortalRole {
  return partnerType === 'distribution' ? 'distribution' : 'marketing';
}

export const VIEW_ROUTES: Record<PortalViewId, string> = {
  dashboard: '/dashboard/portal/overview',
  links: '/dashboard/portal/links',
  coupons: '/dashboard/portal/coupons',
  orders: '/dashboard/portal/orders',
  commissions: '/dashboard/portal/commissions',
  payout: '/dashboard/portal/payouts',
  brand: '/dashboard/portal/brand',
  tier: '/dashboard/portal/tier',
  'tier-rules': '/dashboard/portal/tier-rules',
  profile: '/dashboard/portal/profile',
  support: '/dashboard/portal/support'
};

/** Route → view id, for deriving the active nav item from the URL. */
export const ROUTE_VIEWS = Object.fromEntries(
  Object.entries(VIEW_ROUTES).map(([view, route]) => [route, view as PortalViewId])
) as Record<string, PortalViewId>;

export const VIEW_ICONS: Record<PortalViewId, string> = {
  dashboard: 'i-grid',
  links: 'i-link',
  coupons: 'i-ticket',
  orders: 'i-cart',
  commissions: 'i-chart',
  payout: 'i-wallet',
  brand: 'i-brand',
  tier: 'i-trophy',
  'tier-rules': 'i-shield',
  profile: 'i-user',
  support: 'i-help'
};

/** Sidebar order and the group headings the items sit under. */
export const NAV_GROUPS: { label: string; views: PortalViewId[] }[] = [
  { label: 'Hoạt động', views: ['dashboard', 'links', 'coupons', 'orders'] },
  { label: 'Tài chính', views: ['commissions', 'payout', 'brand'] },
  { label: 'Phát triển', views: ['tier'] },
  { label: 'Tài khoản', views: ['profile', 'support'] }
];

type RoleConfig = {
  name: string;
  brandSub: string;
  accountRole: string;
  nav: Partial<Record<PortalViewId, string>>;
  titles: Record<PortalViewId, [string, string]>;
  /** Views this role never shows in the sidebar. */
  hide: PortalViewId[];
};

const MARKETING_TITLES: Record<PortalViewId, [string, string]> = {
  dashboard: ['Tổng quan', 'Hiệu suất và thu nhập tiếp thị liên kết của bạn'],
  links: ['Liên kết tiếp thị', 'Tạo liên kết giới thiệu, mã QR và theo dõi hiệu suất từng kênh'],
  coupons: ['Mã giảm giá', 'Tạo và quản lý mã giảm giá dành cho khách hàng'],
  orders: ['Đơn hàng', 'Theo dõi nguồn ghi nhận và trạng thái đơn hàng'],
  commissions: ['Hoa hồng', 'Theo dõi khoản phát sinh, chờ xác minh và có thể rút'],
  payout: ['Rút tiền', 'Tạo yêu cầu và theo dõi lịch sử rút hoa hồng'],
  brand: ['Cấu hình thương hiệu', 'Tùy chỉnh nhận diện thương hiệu và nội dung gửi khách hàng'],
  tier: ['Hạng đối tác', 'Theo dõi tiến độ và quyền lợi theo hạng'],
  'tier-rules': ['Quy định xét hạng', 'Điều kiện, kỳ đánh giá và nguyên tắc cập nhật hạng đối tác'],
  profile: ['Hồ sơ', 'Quản lý thông tin pháp lý, thanh toán và bảo mật'],
  support: ['Hỗ trợ', 'Tạo, theo dõi và phản hồi các yêu cầu hỗ trợ']
};

const DISTRIBUTION_TITLES: Record<PortalViewId, [string, string]> = {
  dashboard: ['Tổng quan', 'Theo dõi số dư, đơn hàng và hiệu quả phân phối'],
  links: ['Sản phẩm & bảng giá', 'Tra cứu giá vốn và tạo đơn từ số dư tài khoản'],
  coupons: ['Quản lý eSIM', 'Theo dõi các eSIM đã lấy hàng, đã kích hoạt và còn hiệu lực'],
  orders: ['Đơn hàng', 'Tra cứu đơn hàng theo mã đơn và thời gian mua'],
  commissions: ['Doanh thu & hoa hồng', 'Đối chiếu doanh thu bán ra, giá vốn và phần chênh lệch'],
  payout: ['Thanh toán', 'Quản lý số dư, nạp tiền và lịch sử giao dịch'],
  brand: ['Cấu hình thương hiệu', 'Tùy chỉnh logo, màu sắc và nội dung hiển thị với khách hàng'],
  tier: ['Hạng đối tác', 'Theo dõi điều kiện và quyền lợi phân phối theo hạng'],
  'tier-rules': ['Quy định xét hạng', 'Điều kiện xét hạng dành cho đối tác phân phối'],
  profile: ['Hồ sơ', 'Quản lý pháp nhân, kênh phân phối và thông tin thanh toán'],
  support: ['Hỗ trợ', 'Tạo, theo dõi và phản hồi yêu cầu hỗ trợ phân phối']
};

export const ROLE_CONFIGS: Record<PortalRole, RoleConfig> = {
  marketing: {
    name: 'Đối tác liên kết',
    brandSub: 'Đối tác liên kết',
    accountRole: 'Đối tác liên kết',
    nav: {
      dashboard: 'Tổng quan',
      links: 'Liên kết tiếp thị',
      coupons: 'Mã giảm giá',
      orders: 'Đơn hàng',
      commissions: 'Hoa hồng',
      payout: 'Rút tiền',
      tier: 'Hạng đối tác',
      profile: 'Hồ sơ',
      support: 'Hỗ trợ'
    },
    titles: MARKETING_TITLES,
    hide: ['brand']
  },
  distribution: {
    name: 'Đối tác phân phối',
    brandSub: 'Cổng phân phối eSIM',
    accountRole: 'Đối tác phân phối',
    nav: {
      dashboard: 'Tổng quan',
      links: 'Sản phẩm & bảng giá',
      coupons: 'Quản lý eSIM',
      orders: 'Đơn hàng',
      commissions: 'Doanh thu & hoa hồng',
      payout: 'Thanh toán',
      brand: 'Cấu hình thương hiệu',
      tier: 'Hạng đối tác',
      profile: 'Hồ sơ',
      support: 'Hỗ trợ'
    },
    titles: DISTRIBUTION_TITLES,
    hide: ['commissions']
  }
};

/** Bottom bar on phones: four views plus the "more" sheet (v29 `.mobile-more`). */
export const MOBILE_PRIMARY: PortalViewId[] = ['dashboard', 'links', 'orders', 'commissions'];

/** Everything else, shown in the sheet behind "Thêm" (v29 `.mobile-sheet-grid`). */
export const MOBILE_SHEET: PortalViewId[] = [
  'coupons',
  'payout',
  'brand',
  'tier',
  'profile',
  'support'
];
