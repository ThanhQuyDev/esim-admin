import { NavGroup } from '@/types';

export const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'Destination',
        url: '/dashboard/destinations',
        icon: 'global',
        shortcut: ['p', 'p'],
        isActive: false,
        items: []
      },
      {
        title: 'Region',
        url: '/dashboard/region',
        icon: 'worldMap',
        shortcut: ['r', 'r'],
        isActive: false,
        items: []
      },
      {
        title: 'Esim Plan',
        url: '/dashboard/esim-plan',
        icon: 'product',
        shortcut: ['p', 'p'],
        isActive: false,
        items: []
      },
      {
        title: 'Users',
        url: '/dashboard/users',
        icon: 'teams',
        shortcut: ['u', 'u'],
        isActive: false,
        items: []
      },
      {
        title: 'Blogs',
        url: '/dashboard/blogs',
        icon: 'blog',
        shortcut: ['b', 'b'],
        isActive: false,
        items: []
      },
      {
        title: 'Why Choose Us',
        url: '/dashboard/why-choose-us',
        icon: 'award',
        isActive: false,
        items: []
      },
      {
        title: 'FAQs',
        url: '/dashboard/faqs',
        icon: 'question',
        isActive: false,
        items: []
      },
      {
        title: 'Chat',
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
        title: 'Account',
        url: '#',
        icon: 'account',
        isActive: true,
        items: [
          {
            title: 'Profile',
            url: '/dashboard/profile',
            icon: 'profile',
            shortcut: ['m', 'm']
          },
          {
            title: 'Notifications',
            url: '/dashboard/notifications',
            icon: 'notification',
            shortcut: ['n', 'n']
          }
        ]
      }
    ]
  }
];
