import { NavGroup } from '@/types';

/**
 * Nav rendered instead of the admin `navGroups` when this deployment runs in
 * partner-portal mode (`NEXT_PUBLIC_APP_MODE=partner`) — see app-sidebar.tsx.
 * Self-service only: every route here maps to `/dashboard/portal/*`, which
 * calls the `/partners/me/*` backend endpoints (role: partner or admin).
 */
export const portalNavGroups: NavGroup[] = [
  {
    label: 'Đối tác',
    items: [
      {
        title: 'Tổng quan',
        url: '/dashboard/portal/overview',
        icon: 'dashboard',
        isActive: false,
        items: []
      },
      {
        // Renamed for #047: there is no request to raise any more, the partner
        // just pays.
        title: 'Thanh toán',
        url: '/dashboard/portal/wallet',
        icon: 'wallet',
        isActive: false,
        items: []
      },
      {
        title: 'Link tiếp thị',
        url: '/dashboard/portal/links',
        icon: 'link',
        isActive: false,
        items: []
      },
      {
        title: 'Mã giảm giá',
        url: '/dashboard/portal/coupons',
        icon: 'miniTag',
        isActive: false,
        items: []
      },
      {
        // Đối tác phân phối đặt mua bằng ví ký quỹ (#046).
        title: 'Sản phẩm & bảng giá',
        url: '/dashboard/portal/catalogue',
        icon: 'product',
        isActive: false,
        items: []
      },
      {
        title: 'Quản lý eSIM',
        url: '/dashboard/portal/esims',
        icon: 'simCard',
        isActive: false,
        items: []
      },
      {
        title: 'Đơn hàng',
        url: '/dashboard/portal/orders',
        icon: 'billing',
        isActive: false,
        items: []
      },
      {
        // Doanh thu bán ra − giá vốn đã trừ ví = chênh lệch (#046).
        title: 'Doanh thu và đơn hàng',
        url: '/dashboard/portal/revenue',
        icon: 'trendingUp',
        isActive: false,
        items: []
      },
      {
        title: 'Hoa hồng',
        url: '/dashboard/portal/commissions',
        icon: 'trendingUp',
        isActive: false,
        items: []
      },
      {
        title: 'Rút tiền',
        url: '/dashboard/portal/payouts',
        icon: 'creditCard',
        isActive: false,
        items: []
      },
      {
        title: 'Hạng đối tác',
        url: '/dashboard/portal/tier',
        icon: 'award',
        isActive: false,
        items: []
      },
      {
        title: 'Quy định xét hạng',
        url: '/dashboard/portal/tier-rules',
        icon: 'info',
        isActive: false,
        items: []
      },
      {
        title: 'Cấu hình thương hiệu',
        url: '/dashboard/portal/brand',
        icon: 'media',
        isActive: false,
        items: []
      },
      {
        title: 'Hồ sơ đối tác',
        url: '/dashboard/portal/profile',
        icon: 'profile',
        isActive: false,
        items: []
      },
      {
        title: 'Hỗ trợ',
        url: '/dashboard/portal/support',
        icon: 'help',
        isActive: false,
        items: []
      }
    ]
  }
];

/**
 * Routes that only make sense for a partner who buys stock (#013).
 *
 * A marketing partner earns commission on orders placed on esim.vn; they never
 * hold a deposit balance and have no storefront of their own to brand, so these
 * two menus are removed for them rather than left to open a screen that cannot
 * apply. `PortalFeatureGate` enforces the same rule on the routes themselves.
 */
export const DISTRIBUTION_ONLY_PORTAL_URLS = [
  '/dashboard/portal/wallet',
  '/dashboard/portal/brand',
  // Stock only a distribution partner holds (#046).
  '/dashboard/portal/esims',
  // Mua hàng bằng ví ký quỹ, và đối chiếu giá vốn với giá niêm yết (#046).
  '/dashboard/portal/catalogue',
  '/dashboard/portal/revenue'
];

/**
 * The affiliate programme's own screens (#048).
 *
 * A marketing partner always has them. A distribution partner only does once
 * esim.vn grants the affiliate programme, so until then these four are removed
 * from their menu — the routes themselves are gated too, for a bookmark.
 */
export const AFFILIATE_ONLY_PORTAL_URLS = [
  '/dashboard/portal/links',
  '/dashboard/portal/coupons',
  '/dashboard/portal/commissions',
  '/dashboard/portal/payouts'
];
