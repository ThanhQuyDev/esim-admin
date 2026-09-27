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
        title: 'Ví & Ký quỹ',
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
        title: 'Đơn hàng',
        url: '/dashboard/portal/orders',
        icon: 'billing',
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
  '/dashboard/portal/brand'
];
