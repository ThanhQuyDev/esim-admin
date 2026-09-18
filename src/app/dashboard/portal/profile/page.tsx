import { PortalProfileView } from '@/features/partner-portal/components/portal-profile-view';

export const metadata = {
  title: 'Cổng đối tác: Hồ sơ'
};

/**
 * The portal shell draws the heading and the `.content` padding the v29 design
 * specifies, so this page renders its view directly.
 */
export default function PortalProfilePage() {
  return <PortalProfileView />;
}
