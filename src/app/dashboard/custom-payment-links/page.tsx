import PageContainer from '@/components/layout/page-container';
import { CustomPaymentLinkListing } from '@/features/custom-payment-links/components/custom-payment-link-listing';

export const metadata = {
  title: 'Dashboard: Lệnh thanh toán tùy ý'
};

export default function CustomPaymentLinksPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Lệnh thanh toán tùy ý'
      pageDescription='Tạo link thanh toán OnePay với số tiền tùy ý để gửi cho khách qua chat/email.'
    >
      <CustomPaymentLinkListing />
    </PageContainer>
  );
}
