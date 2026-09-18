import { PortalWalletView } from '@/features/partner-portal/components/portal-wallet-view';

export const metadata = {
  title: 'Cổng đối tác: Ví ký quỹ'
};

/**
 * The portal shell draws the heading and the `.content` padding the v29 design
 * specifies, so this page renders its view directly.
 */
export default function PortalWalletPage() {
  return <PortalWalletView />;
}
