import PageContainer from '@/components/layout/page-container';
import OrderListingPage from '@/features/orders/components/order-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Quản lý đơn hàng'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function OrdersPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='Quản lý đơn hàng'
      pageDescription='Danh sách các đơn hàng trong hệ thống.'
    >
      <OrderListingPage />
    </PageContainer>
  );
}
