import PageContainer from '@/components/layout/page-container';
import MiniTagListingPage from '@/features/mini-tags/components/mini-tag-listing';
import { MiniTagFormDialogTrigger } from '@/features/mini-tags/components/mini-tag-form-dialog';

export default function MiniTagsPage() {
  return (
    <PageContainer
      pageTitle='Mini Tags'
      pageDescription='Quản lý danh sách mini tag'
      pageHeaderAction={<MiniTagFormDialogTrigger />}
    >
      <MiniTagListingPage />
    </PageContainer>
  );
}
