import { PortalCouponsView } from '@/features/partner-portal/components/portal-coupons-view';

export const metadata = {
  title: 'Cổng đối tác: Mã giảm giá'
};

/**
 * The portal shell draws the heading and the `.content` padding the v29 design
 * specifies, so this page renders its view directly.
 */
export default function PortalCouponsPage() {
  return <PortalCouponsView />;
}
