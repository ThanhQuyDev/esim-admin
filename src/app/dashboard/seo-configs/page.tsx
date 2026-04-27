import PageContainer from '@/components/layout/page-container';
import SeoConfigListingPage from '@/features/seo-configs/components/seo-config-listing';
import { SeoConfigFormDialogTrigger } from '@/features/seo-configs/components/seo-config-form-dialog';

export const metadata = {
  title: 'Cấu hình SEO'
};

export default function SeoConfigsPage() {
  return (
    <PageContainer
      pageTitle='Cấu hình SEO'
      pageDescription='Quản lý cấu hình SEO cho các trang.'
      pageHeaderAction={<SeoConfigFormDialogTrigger />}
    >
      <SeoConfigListingPage />
    </PageContainer>
  );
}
