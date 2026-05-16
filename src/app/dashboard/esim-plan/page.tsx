import PageContainer from '@/components/layout/page-container';
import PlanListingPage from '@/features/plans/components/plan-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';
import { PlanFormDialogTrigger } from '@/features/plans/components/plan-form-dialog';
import { ImportGadgetKoreaExcelDialog } from '@/features/plans/components/import-gadget-korea-excel-dialog';
import { ImportJapanTravelSimExcelDialog } from '@/features/plans/components/import-japan-travel-sim-excel-dialog';

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
          <ImportGadgetKoreaExcelDialog />
          <ImportJapanTravelSimExcelDialog />
          <PlanFormDialogTrigger />
        </div>
      }
    >
      <PlanListingPage />
    </PageContainer>
  );
}
