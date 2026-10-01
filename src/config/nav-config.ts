import { NavGroup } from '@/types';

export const navGroups: NavGroup[] = [
  {
    label: 'Tổng quan',
    items: [
      {
        title: 'Bảng điều khiển',
        url: '/dashboard/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'Điểm đến',
        url: '/dashboard/destinations',
        icon: 'global',
        shortcut: ['p', 'p'],
        isActive: false,
        items: []
      },
      {
        title: 'Khu vực',
        url: '/dashboard/region',
        icon: 'worldMap',
        shortcut: ['r', 'r'],
        isActive: false,
        items: []
      },
      {
        title: 'Gói eSIM',
        url: '/dashboard/esim-plan',
        icon: 'product',
        shortcut: ['p', 'p'],
        isActive: false,
        items: []
      },
      {
        title: 'Quản lý eSIM',
        url: '/dashboard/esims',
        icon: 'simCard',
        shortcut: ['e', 's'],
        isActive: false,
        items: []
      },
      {
        title: 'Đơn hàng',
        url: '/dashboard/orders',
        icon: 'order',
        shortcut: ['o', 'o'],
        isActive: false,
        items: []
      },
      {
        title: 'Tickets',
        url: '/dashboard/tickets',
        icon: 'customerService',
        shortcut: ['t', 't'],
        isActive: false,
        badge: 'tickets-open',
        items: []
      },
      {
        title: 'Người dùng',
        url: '/dashboard/users',
        icon: 'teams',
        shortcut: ['u', 'u'],
        isActive: false,
        items: []
      },
      {
        title: 'Hạng khách hàng',
        url: '/dashboard/membership-tiers',
        icon: 'award',
        isActive: false,
        items: []
      },
      {
        title: 'Blog',
        url: '/dashboard/blogs',
        icon: 'blog',
        shortcut: ['b', 'b'],
        isActive: false,
        items: []
      },
      {
        title: 'Tại sao chọn chúng tôi',
        url: '/dashboard/why-choose-us',
        icon: 'award',
        isActive: false,
        items: []
      },
      {
        title: 'Hero Banners',
        url: '/dashboard/hero-banners',
        icon: 'media',
        isActive: false,
        items: []
      },
      {
        title: 'Top Bars',
        url: '/dashboard/top-bars',
        icon: 'panelLeft',
        isActive: false,
        items: []
      },
      {
        title: 'Slide Main Menu',
        url: '/dashboard/menu-slides',
        icon: 'media',
        isActive: false,
        items: []
      },
      {
        title: 'Footers',
        url: '/dashboard/footers',
        icon: 'link',
        isActive: false,
        items: []
      },
      {
        title: 'Câu hỏi thường gặp',
        url: '/dashboard/faqs',
        icon: 'question',
        isActive: false,
        items: []
      },
      {
        title: 'Trung tâm hỗ trợ',
        url: '/dashboard/help-center',
        icon: 'help',
        isActive: false,
        items: []
      },
      {
        title: 'Thiết bị được hỗ trợ',
        url: '/dashboard/supported-devices',
        icon: 'product',
        isActive: false,
        items: []
      },
      {
        title: 'Ghi chú theo hãng',
        url: '/dashboard/manufacturer-notes',
        icon: 'phone',
        isActive: false,
        items: []
      },
      {
        title: 'APN TikTok & ChatGPT',
        url: '/dashboard/apn-support',
        icon: 'global',
        isActive: false,
        items: []
      },
      {
        title: 'Email Templates',
        url: '/dashboard/email-templates',
        icon: 'mail',
        isActive: false,
        items: []
      },
      {
        // Logo / ảnh / nội dung của trang đăng nhập quản trị và đối tác (#006).
        title: 'Trang đăng nhập',
        url: '/dashboard/auth-pages',
        icon: 'login',
        isActive: false,
        items: []
      },
      {
        title: 'Cấu hình SEO',
        url: '/dashboard/seo-configs',
        icon: 'seo',
        isActive: false,
        items: []
      },
      {
        title: 'Script toàn site',
        url: '/dashboard/site-scripts',
        icon: 'code',
        isActive: false,
        items: []
      },
      {
        title: 'Mini Tags',
        url: '/dashboard/mini-tags',
        icon: 'miniTag',
        isActive: false,
        items: []
      },
      {
        title: 'Coupon',
        url: '/dashboard/coupons',
        icon: 'billing',
        isActive: false,
        items: []
      },
      {
        title: 'Profit Margin',
        url: '/dashboard/profit-margins',
        icon: 'trendingUp',
        isActive: false,
        items: []
      },
      {
        // One entry for everything supplier-related (#005): thuế phí (#049),
        // ký quỹ and the on/off switch, split into tabs on the page itself.
        title: 'Nhà cung cấp',
        url: '/dashboard/providers',
        icon: 'wallet',
        isActive: false,
        items: []
      },
      {
        title: 'Lệnh thanh toán tùy ý',
        url: '/dashboard/custom-payment-links',
        icon: 'creditCard',
        shortcut: ['c', 'p'],
        isActive: false,
        items: []
      },
      {
        title: 'Ví eXu',
        url: '/dashboard/wallets',
        icon: 'wallet',
        isActive: false,
        items: []
      },
      {
        title: 'Quản lý đối tác',
        url: '#',
        icon: 'teams',
        isActive: false,
        access: { role: [1] },
        items: [
          {
            title: 'Tổng quan',
            url: '/dashboard/partners/overview',
            access: { role: [1] }
          },
          {
            // Renamed per #075: the page now edits the programme's rules
            // rather than only listing them.
            title: 'Cấu hình chung',
            url: '/dashboard/partners/settings',
            access: { role: [1] }
          },
          {
            // Renamed per #057: the page lists every kind of partner, not
            // only KOLs.
            title: 'Danh sách đối tác',
            url: '/dashboard/partners',
            access: { role: [1] }
          },
          {
            title: 'Duyệt đăng ký',
            url: '/dashboard/partners/approvals',
            access: { role: [1] }
          },
          {
            title: 'Yêu cầu nạp ký quỹ',
            url: '/dashboard/partners/deposit-requests',
            access: { role: [1] }
          },
          {
            // Renamed per #063: the page is where commission is reconciled,
            // not only listed.
            title: 'Hoa hồng & Đối soát',
            url: '/dashboard/partners/commissions',
            access: { role: [1] }
          },
          {
            // The same order screens the partners see, one tab per partner
            // type, with the scope opened up to every partner (#071).
            title: 'Đơn hàng đối tác',
            url: '/dashboard/partners/orders',
            access: { role: [1] }
          },
          {
            title: 'Tài chính',
            url: '/dashboard/partners/payouts',
            access: { role: [1] }
          },
          {
            title: 'Hạng đối tác',
            url: '/dashboard/partners/tiers',
            access: { role: [1] }
          },
          {
            // Announcements to partners, by group or to everybody (#079).
            title: 'Thông báo',
            url: '/dashboard/partners/notifications',
            access: { role: [1] }
          }
        ]
      },
      {
        title: 'Trò chuyện',
        url: '/dashboard/chat',
        icon: 'chat',
        shortcut: ['c', 'c'],
        isActive: false,
        badge: 'chat-waiting',
        items: [
          {
            title: 'Tin nhắn',
            url: '/dashboard/chat'
          },
          {
            title: 'Cài đặt',
            url: '/dashboard/chat/settings'
          }
        ]
      }
    ]
  },
  {
    label: '',
    items: [
      {
        title: 'Tài khoản',
        url: '#',
        icon: 'account',
        isActive: true,
        items: [
          {
            title: 'Hồ sơ',
            url: '/dashboard/profile',
            icon: 'profile',
            shortcut: ['m', 'm']
          },
          {
            title: 'Thông báo',
            url: '/dashboard/notifications',
            icon: 'notification',
            shortcut: ['n', 'n']
          }
        ]
      }
    ]
  }
];
