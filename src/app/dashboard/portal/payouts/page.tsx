import { PortalPayoutsView } from '@/features/partner-portal/components/portal-payouts-view';

export const metadata = {
  title: 'Cổng đối tác: Yêu cầu rút tiền'
};

/**
 * The portal shell draws the heading and the `.content` padding the v29 design
 * specifies, so this page renders its view directly.
 */
export default function PortalPayoutsPage() {
  return <PortalPayoutsView />;
}
