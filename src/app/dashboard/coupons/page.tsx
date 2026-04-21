import PageContainer from '@/components/layout/page-container';
import CouponListingPage from '@/features/coupons/components/coupon-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';
import { CouponFormDialogTrigger } from '@/features/coupons/components/coupon-form-dialog';

export const metadata = {
  title: 'Dashboard: Coupon'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function CouponsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='Coupon'
      pageDescription='Quản lý mã giảm giá.'
      pageHeaderAction={<CouponFormDialogTrigger />}
    >
      <CouponListingPage />
    </PageContainer>
  );
}
