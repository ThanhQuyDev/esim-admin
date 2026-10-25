'use client';

import { useRouter } from 'next/navigation';
import { PartnerNotificationComposer } from '@/features/partners/components/partner-notifications-view';

/** The partner composer, back to the list once sent (vande #072). */
export function PartnerComposerPage() {
  const router = useRouter();
  return (
    <PartnerNotificationComposer
      onSent={() => router.push('/dashboard/announcements?tab=partner')}
    />
  );
}
