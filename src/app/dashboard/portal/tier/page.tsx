import { PortalTierView } from '@/features/partner-portal/components/portal-tier-view';

export const metadata = {
  title: 'Cổng đối tác: Hạng đối tác'
};

/**
 * The portal shell draws the heading and the `.content` padding the v29 design
 * specifies, so this page renders its view directly.
 */
export default function PortalTierPage() {
  return <PortalTierView />;
}
