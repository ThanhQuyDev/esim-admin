import { PortalOrdersView } from '@/features/partner-portal/components/portal-orders-view';

export const metadata = {
  title: 'Cổng đối tác: Đơn hàng'
};

/**
 * The portal shell draws the heading and the `.content` padding the v29 design
 * specifies, so this page renders its view directly.
 */
export default function PortalOrdersPage() {
  return <PortalOrdersView />;
}
