import PageContainer from '@/components/layout/page-container';
import WalletListingPage from '@/features/wallets/components/wallet-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Quản lý ví eXu'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function WalletsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='Quản lý ví eXu'
      pageDescription='Danh sách ví của tất cả người dùng trong hệ thống.'
    >
      <WalletListingPage />
    </PageContainer>
  );
}
