import { PortalCommissionsView } from '@/features/partner-portal/components/portal-commissions-view';

export const metadata = {
  title: 'Cổng đối tác: Hoa hồng'
};

/**
 * The portal shell draws the heading and the `.content` padding the v29 design
 * specifies, so this page renders its view directly.
 */
export default function PortalCommissionsPage() {
  return <PortalCommissionsView />;
}
