import KBar from '@/components/kbar';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { ScrollToTop } from '@/components/scroll-to-top';
import { InfobarProvider } from '@/components/ui/infobar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { BreadcrumbProvider } from '@/hooks/use-breadcrumb-context';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Next Shadcn Dashboard Starter',
  description: 'Basic dashboard with Next.js and Shadcn',
  robots: {
    index: false,
    follow: false
  }
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Persisting the sidebar state in the cookie.
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';
  return (
    <KBar>
      <BreadcrumbProvider>
        <InfobarProvider>
          <SidebarProvider defaultOpen={defaultOpen}>
            <AppSidebar />
            <SidebarInset className='overflow-hidden'>
              <Header />
              {/* page main content */}
              {children}
              {/* page main content ends */}
              <ScrollToTop />
            </SidebarInset>
          </SidebarProvider>
        </InfobarProvider>
      </BreadcrumbProvider>
    </KBar>
  );
}
