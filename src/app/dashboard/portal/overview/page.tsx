import { PortalOverviewView } from '@/features/partner-portal/components/portal-overview-view';

export const metadata = {
  title: 'Cổng đối tác: Tổng quan'
};

/**
 * The portal shell draws the heading and the `.content` padding the v29 design
 * specifies, so this page renders its view directly.
 */
export default function PortalOverviewPage() {
  return <PortalOverviewView />;
}
