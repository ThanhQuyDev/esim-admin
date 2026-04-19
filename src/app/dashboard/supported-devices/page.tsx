import { Suspense } from 'react';
import PageContainer from '@/components/layout/page-container';
import SupportedDevicesListingPage from '@/features/supported-devices/components/supported-devices-listing';
import { SupportedDeviceFormDialogTrigger } from '@/features/supported-devices/components/supported-device-form-dialog';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Thiết bị được hỗ trợ'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function SupportedDevicesPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='Thiết bị được hỗ trợ'
      pageDescription='Quản lý danh sách các thiết bị được hỗ trợ.'
      pageHeaderAction={<SupportedDeviceFormDialogTrigger />}
    >
      <Suspense fallback={<div className='h-96 w-full animate-pulse rounded-lg bg-muted' />}>
        <SupportedDevicesListingPage />
      </Suspense>
    </PageContainer>
  );
}
