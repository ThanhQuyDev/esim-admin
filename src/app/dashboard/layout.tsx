import KBar from '@/components/kbar';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { ScrollToTop } from '@/components/scroll-to-top';
import { InfobarProvider } from '@/components/ui/infobar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { BreadcrumbProvider } from '@/hooks/use-breadcrumb-context';
import { ChatNotificationListener } from '@/features/chat/components/chat-notification-listener';
import { IS_PARTNER_PORTAL } from '@/config/app-mode';
import { RoleRouteGuard } from '@/components/layout/role-route-guard';
import { MustChangePasswordRedirect } from '@/features/partner-portal/components/must-change-password-gate';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { SessionRoleProvider } from '@/components/layout/session-role';
import { roleIdFromToken } from '@/lib/session-role';

export const metadata: Metadata = {
  title: IS_PARTNER_PORTAL ? 'Cổng đối tác esim.vn' : 'Quản trị esim.vn',
  description: IS_PARTNER_PORTAL ? 'Cổng dành cho đối tác esim.vn' : 'Trang quản trị esim.vn',
  robots: {
    index: false,
    follow: false
  }
};

/**
 * One shell for both deployments. The partner portal wears the same sidebar,
 * header and theming as the admin console — `AppSidebar` swaps the brand and
 * the nav groups on `IS_PARTNER_PORTAL`, so nothing here needs to branch.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Persisting the sidebar state in the cookie.
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';
  // Who is signed in, from the first paint (vande #040).
  const roleId = roleIdFromToken(cookieStore.get('token')?.value);
  return (
    <SessionRoleProvider roleId={roleId}>
      <KBar>
        <BreadcrumbProvider>
          <InfobarProvider>
            <SidebarProvider defaultOpen={defaultOpen}>
              <AppSidebar />
              <SidebarInset className='overflow-x-hidden overflow-y-auto lg:overflow-hidden'>
                <Header />
                {/* A temporary password keeps a partner on the form (doitac-1410 #011). */}
                {IS_PARTNER_PORTAL && <MustChangePasswordRedirect />}
                {/* page main content */}
                <RoleRouteGuard>{children}</RoleRouteGuard>
                {/* page main content ends */}
                <ScrollToTop />
              </SidebarInset>
            </SidebarProvider>
            <ChatNotificationListener />
          </InfobarProvider>
        </BreadcrumbProvider>
      </KBar>
    </SessionRoleProvider>
  );
}
