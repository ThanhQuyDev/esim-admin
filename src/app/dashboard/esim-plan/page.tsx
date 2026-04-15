import PageContainer from '@/components/layout/page-container';
import PlanListingPage from '@/features/plans/components/plan-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';
import { PlanFormSheetTrigger } from '@/features/plans/components/plan-form-sheet';
import { ImportExcelDialog } from '@/features/plans/components/import-excel-dialog';

export const metadata = {
  title: 'Dashboard: Gói eSIM'
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
      pageTitle='Gói eSIM'
      pageDescription='Quản lý các gói eSIM của bạn.'
      pageHeaderAction={
        <div className='flex items-center gap-2'>
          <ImportExcelDialog />
          <PlanFormSheetTrigger />
        </div>
      }
    >
      <PlanListingPage />
    </PageContainer>
  );
}
