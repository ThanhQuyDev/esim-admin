import { Suspense } from 'react';
import PageContainer from '@/components/layout/page-container';
import AuthPageSettingsListingPage from '@/features/auth-pages/components/auth-page-settings-listing';
import { AuthPageSettingsSkeleton } from '@/features/auth-pages/components/auth-page-settings-view';

export const metadata = { title: 'Dashboard: Trang đăng nhập' };

/** Logo, ảnh và nội dung của hai trang đăng nhập (#006). */
export default function AuthPagesSettingsPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Trang đăng nhập'
      pageDescription='Thay logo, ảnh nền và nội dung giới thiệu ở trang đăng nhập quản trị và đối tác.'
    >
      <Suspense fallback={<AuthPageSettingsSkeleton />}>
        <AuthPageSettingsListingPage />
      </Suspense>
    </PageContainer>
  );
}
