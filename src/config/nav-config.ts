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
        title: 'Người dùng',
        url: '/dashboard/users',
        icon: 'teams',
        shortcut: ['u', 'u'],
        isActive: false,
        items: []
      },
      {
        title: 'Bài viết',
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
        title: 'Câu hỏi thường gặp',
        url: '/dashboard/faqs',
        icon: 'question',
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
        title: 'Trò chuyện',
        url: '/dashboard/chat',
        icon: 'chat',
        shortcut: ['c', 'c'],
        isActive: false,
        items: []
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
