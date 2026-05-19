import PageContainer from '@/components/layout/page-container';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';
import TicketListingPage from '@/features/tickets/components/ticket-listing';

export const metadata = { title: 'Dashboard: Tickets' };

type PageProps = { searchParams: Promise<SearchParams> };

export default async function TicketsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='Tickets'
      pageDescription='Quản lý yêu cầu hỗ trợ từ khách hàng.'
    >
      <TicketListingPage />
    </PageContainer>
  );
}
