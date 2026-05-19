import { Suspense } from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { getQueryClient } from '@/lib/query-client';
import { ticketByIdQueryOptions } from '@/features/tickets/api/queries';
import {
  TicketDetailSkeleton,
  TicketDetailView
} from '@/features/tickets/components/ticket-detail-view';

export const metadata = { title: 'Dashboard: Chi tiết ticket' };

type PageProps = { params: Promise<{ id: string }> };

export default async function TicketDetailPage(props: PageProps) {
  const { id } = await props.params;
  const ticketId = Number(id);
  if (!Number.isFinite(ticketId) || ticketId <= 0) notFound();

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(ticketByIdQueryOptions(ticketId));

  return (
    <PageContainer scrollable pageTitle='Chi tiết ticket'>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<TicketDetailSkeleton />}>
          <TicketDetailView id={ticketId} />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
