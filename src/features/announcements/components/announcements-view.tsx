'use client';

/**
 * "Thông báo" (vande #072): its own menu now, with a tab for customers and
 * one for partners. Each opens on what has been sent, with the button to
 * compose a new one above it.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/icons';
import { PartnerNotificationsList } from '@/features/partners/components/partner-notifications-view';

import { CustomerAnnouncementsList } from './customer-announcements-list';

export type AnnouncementTab = 'customer' | 'partner';

export function AnnouncementsView({ initialTab }: { initialTab: AnnouncementTab }) {
  const router = useRouter();
  const [tab, setTab] = useState<AnnouncementTab>(initialTab);

  return (
    <Tabs
      value={tab}
      onValueChange={(next) => {
        setTab(next as AnnouncementTab);
        // In the address too, so a reload or a shared link opens this tab.
        router.replace(`/dashboard/announcements?tab=${next}`, { scroll: false });
      }}
      className='grid min-w-0 grid-cols-1 gap-4'
    >
      <TabsList className='w-full sm:w-fit'>
        <TabsTrigger value='customer' data-testid='tab-customer'>
          Thông báo Khách hàng
        </TabsTrigger>
        <TabsTrigger value='partner' data-testid='tab-partner'>
          Thông báo Đối tác
        </TabsTrigger>
      </TabsList>

      <TabsContent value='customer' className='grid min-w-0 grid-cols-1 gap-4'>
        <div>
          <Button asChild data-testid='compose-customer'>
            <Link href='/dashboard/announcements/customer/new'>
              <Icons.add className='mr-2 h-4 w-4' /> Soạn thông báo gửi khách hàng
            </Link>
          </Button>
        </div>
        <CustomerAnnouncementsList />
      </TabsContent>

      <TabsContent value='partner' className='grid min-w-0 grid-cols-1 gap-4'>
        <div>
          <Button asChild data-testid='compose-partner'>
            <Link href='/dashboard/announcements/partner/new'>
              <Icons.add className='mr-2 h-4 w-4' /> Soạn thông báo gửi đối tác
            </Link>
          </Button>
        </div>
        <PartnerNotificationsList />
      </TabsContent>
    </Tabs>
  );
}
