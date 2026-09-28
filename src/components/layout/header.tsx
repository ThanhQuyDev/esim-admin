import React from 'react';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Breadcrumbs } from '../breadcrumbs';
import SearchInput from '../search-input';
import { ThemeSelector } from '../themes/theme-selector';
import { ThemeModeToggle } from '../themes/theme-mode-toggle';
import { IS_PARTNER_PORTAL } from '@/config/app-mode';
import { AdminNotificationBell } from '@/features/partners/components/admin-notification-bell';
import { PortalNotificationBell } from '@/features/partner-portal/components/portal-notification-bell';

export default function Header() {
  return (
    <header className='bg-background sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2'>
      <div className='flex items-center gap-2 px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-2 h-4' />
        <Breadcrumbs />
      </div>

      <div className='flex items-center gap-2 px-4'>
        <div className='hidden md:flex'>
          <SearchInput />
        </div>
        <ThemeModeToggle />
        <div className='hidden sm:block'>
          <ThemeSelector />
        </div>
        {/*
          The same announcements on both sides (#079): the partner's bell is an
          inbox with unread dots, the admin's is the record of what went out.
        */}
        {IS_PARTNER_PORTAL ? <PortalNotificationBell /> : <AdminNotificationBell />}
      </div>
    </header>
  );
}
