import PageContainer from '@/components/layout/page-container';
import ProfitMarginTierListingPage from '@/features/profit-margins/components/profit-margin-tier-listing';
import { ProfitMarginTierFormDialogTrigger } from '@/features/profit-margins/components/profit-margin-tier-form-dialog';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = { title: 'Dashboard: Profit Margin Tiers' };

type PageProps = { searchParams: Promise<SearchParams> };

export default async function ProfitMarginTiersPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);
  return (
    <PageContainer
      scrollable={false}
      pageTitle='Profit Margin Tiers'
      pageDescription='Manage tiered profit margin ranges for plan pricing.'
      pageHeaderAction={<ProfitMarginTierFormDialogTrigger />}
    >
      <ProfitMarginTierListingPage />
    </PageContainer>
  );
}
