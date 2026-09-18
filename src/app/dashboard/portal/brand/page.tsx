import { PortalBrandView } from '@/features/partner-portal/components/portal-brand-view';

export const metadata = {
  title: 'Cổng đối tác: Cấu hình thương hiệu'
};

/**
 * The portal shell draws the heading and the `.content` padding the v29 design
 * specifies, so this page renders its view directly.
 */
export default function PortalBrandPage() {
  return <PortalBrandView />;
}
