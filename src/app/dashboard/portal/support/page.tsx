import { PortalSupportView } from '@/features/partner-portal/components/portal-support-view';

export const metadata = {
  title: 'Cổng đối tác: Hỗ trợ'
};

/**
 * The portal shell draws the heading and the `.content` padding the v29 design
 * specifies, so this page renders its view directly.
 */
export default function PortalSupportPage() {
  return <PortalSupportView />;
}
