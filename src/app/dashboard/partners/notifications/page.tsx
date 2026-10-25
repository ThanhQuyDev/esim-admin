import { redirect } from 'next/navigation';

/**
 * Partner announcements moved to the "Thông báo" menu, beside the customer
 * ones (vande #072). Old links land on that tab.
 */
export default function PartnerNotificationsPage() {
  redirect('/dashboard/announcements?tab=partner');
}
