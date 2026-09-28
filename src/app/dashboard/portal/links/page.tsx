import PageContainer from '@/components/layout/page-container';
import { PortalLinksView } from '@/features/partner-portal/components/portal-links-view';
import { PortalFeatureGate } from '@/features/partner-portal/components/portal-feature-gate';

export const metadata = {
  title: 'Cổng đối tác: Link tiếp thị'
};

export default function PortalLinksPage() {
  return (
    <PageContainer
      pageTitle='Link tiếp thị'
      pageDescription='Tạo liên kết giới thiệu, mã QR và theo dõi hiệu suất từng kênh.'
    >
      <PortalFeatureGate
        allow={['kol']}
        allowIfAffiliate
        title='Link tiếp thị chưa được bật'
        description='Chương trình tiếp thị chưa được bật cho tài khoản của bạn. Đối tác phân phối cần được esim.vn cấp quyền affiliate mới dùng được link tiếp thị, mã giảm giá, hoa hồng và rút tiền. Liên hệ esim.vn nếu bạn muốn tham gia.'
      >
        <PortalLinksView />
      </PortalFeatureGate>
    </PageContainer>
  );
}
