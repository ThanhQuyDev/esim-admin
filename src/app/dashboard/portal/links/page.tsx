import { PortalLinksView } from '@/features/partner-portal/components/portal-links-view';

export const metadata = {
  title: 'Cổng đối tác: Link tiếp thị'
};

/**
 * The portal shell draws the heading and the `.content` padding the v29 design
 * specifies, so this page renders its view directly.
 */
export default function PortalLinksPage() {
  return <PortalLinksView />;
}
