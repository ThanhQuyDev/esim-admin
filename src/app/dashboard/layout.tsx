import KBar from '@/components/kbar';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { ScrollToTop } from '@/components/scroll-to-top';
import { InfobarProvider } from '@/components/ui/infobar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { BreadcrumbProvider } from '@/hooks/use-breadcrumb-context';
import { ChatNotificationListener } from '@/features/chat/components/chat-notification-listener';
import { PortalShell } from '@/features/partner-portal/components/portal-shell';
import { IS_PARTNER_PORTAL } from '@/config/app-mode';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: IS_PARTNER_PORTAL ? 'Cổng đối tác esim.vn' : 'Quản trị esim.vn',
  description: IS_PARTNER_PORTAL ? 'Cổng dành cho đối tác esim.vn' : 'Trang quản trị esim.vn',
  robots: {
    index: false,
    follow: false
  }
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // The partner deployment serves only `/dashboard/portal/*` and wears the v29
  // portal chrome instead of the admin sidebar, so it never builds the admin
  // shell around a partner screen.
  if (IS_PARTNER_PORTAL) {
    return (
      <>
        <PortalShell>{children}</PortalShell>
        <ChatNotificationListener />
      </>
    );
  }

  // Persisting the sidebar state in the cookie.
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';
  return (
    <KBar>
      <BreadcrumbProvider>
        <InfobarProvider>
          <SidebarProvider defaultOpen={defaultOpen}>
            <AppSidebar />
            <SidebarInset className='overflow-x-hidden overflow-y-auto lg:overflow-hidden'>
              <Header />
              {/* page main content */}
              {children}
              {/* page main content ends */}
              <ScrollToTop />
            </SidebarInset>
          </SidebarProvider>
          <ChatNotificationListener />
        </InfobarProvider>
      </BreadcrumbProvider>
    </KBar>
  );
}
