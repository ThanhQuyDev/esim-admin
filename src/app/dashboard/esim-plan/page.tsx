import PageContainer from '@/components/layout/page-container';
import PlanListingPage from '@/features/plans/components/plan-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';
import { PlanFormDialogTrigger } from '@/features/plans/components/plan-form-dialog';
import { ImportGadgetKoreaExcelDialog } from '@/features/plans/components/import-gadget-korea-excel-dialog';
import { ImportEsimAccessDialog } from '@/features/plans/components/import-esimaccess-dialog';
import { ExportPlansExcelButton } from '@/features/plans/components/export-plans-excel-button';

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
        // The buttons wrap rather than run off a phone screen (vande-0411 #027).
        // "Export Excel" joined the imports here (vande-1411 #044).
        <div className='flex max-w-[70vw] flex-wrap items-center justify-end gap-2'>
          <ExportPlansExcelButton />
          <ImportGadgetKoreaExcelDialog />
          <ImportEsimAccessDialog />
          <PlanFormDialogTrigger />
        </div>
      }
    >
      <PlanListingPage />
    </PageContainer>
  );
}
