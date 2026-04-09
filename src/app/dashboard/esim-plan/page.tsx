import PageContainer from '@/components/layout/page-container';
import PlanListingPage from '@/features/plans/components/plan-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';
import { PlanFormSheetTrigger } from '@/features/plans/components/plan-form-sheet';

export const metadata = {
  title: 'Dashboard: eSIM Plans'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function EsimPlanPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='eSIM Plans'
      pageDescription='Manage your eSIM plans.'
      pageHeaderAction={<PlanFormSheetTrigger />}
    >
      <PlanListingPage />
    </PageContainer>
  );
}
