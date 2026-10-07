'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { ADMIN_HOME_PATH, IS_PARTNER_PORTAL } from '@/config/app-mode';
import { AUTHOR_HOME_PATH, ROLE_AUTHOR, canOpenPath } from '@/config/role-access';
import { authMeQueryOptions } from '@/features/auth/api/queries';

/**
 * Keeps an author inside the pages they may use (#011). Hiding the menu is not
 * enough — a page reached by typing its URL must say so too. The backend still
 * refuses the requests either way; this only stops a half-broken page showing.
 */
export function RoleRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user, isPending, isError } = useQuery(authMeQueryOptions);
  const roleId = user?.role?.id;

  // The console's landing page is the admin overview; an author has none.
  const landsOnAdminHome =
    roleId === ROLE_AUTHOR && (pathname === ADMIN_HOME_PATH || pathname === '/dashboard');

  useEffect(() => {
    if (landsOnAdminHome) router.replace(AUTHOR_HOME_PATH);
  }, [landsOnAdminHome, router]);

  // The partner portal has its own route split (proxy.ts); a failed /me is
  // left to the existing sign-in redirect.
  if (IS_PARTNER_PORTAL || isError) return <>{children}</>;
  if (isPending || landsOnAdminHome) return null;
  if (canOpenPath(roleId, pathname)) return <>{children}</>;

  return (
    <div className='flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center'>
      <Icons.lock className='text-muted-foreground size-10' />
      <div className='space-y-1'>
        <h2 className='text-lg font-semibold'>Bạn chưa được cấp quyền truy cập trang này</h2>
        <p className='text-muted-foreground text-sm'>Vui lòng liên hệ admin để được hỗ trợ.</p>
      </div>
      {roleId === ROLE_AUTHOR && (
        <Button asChild variant='outline'>
          <Link href={AUTHOR_HOME_PATH}>Về trang Blog</Link>
        </Button>
      )}
    </div>
  );
}
