import PageContainer from '@/components/layout/page-container';
import UserListingPage from '@/features/users/components/user-listing';
import { UsersTabs } from '@/features/users/components/users-tabs';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';
import { usersInfoContent } from '@/features/users/info-content';
import { UserFormDialogTrigger } from '@/features/users/components/user-form-dialog';

export const metadata = {
  title: 'Dashboard: Người dùng'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function UsersPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='Người dùng'
      infoContent={usersInfoContent}
      pageHeaderAction={<UserFormDialogTrigger />}
    >
      <div className='flex flex-1 flex-col gap-4'>
        <UsersTabs />
        <UserListingPage />
      </div>
    </PageContainer>
  );
}
