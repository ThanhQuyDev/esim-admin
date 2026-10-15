'use client';

/**
 * Make a partner replace the password an admin emailed them (#059).
 *
 * The account was created by hand and its password travelled through an inbox,
 * so it is not really theirs until they choose one. The brief asks for exactly
 * this: "khi đăng nhập lần đầu bằng mật khẩu ngẫu nhiên thì hệ thống sẽ yêu cầu
 * thay đổi mật khẩu đăng nhập để tiếp tục sử dụng dịch vụ".
 *
 * Two parts (doitac-1410 #011). The redirect sits in the portal's layout, so
 * every menu but "Hỗ trợ" lands on the password form — it used to sit on the
 * overview alone, and every other menu worked as normal. It opens the profile
 * on its "Bảo mật" tab, where the form is, rather than on the first tab with a
 * note to scroll. The banner stays on the profile page and says why.
 */

import { Suspense, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import { authMeQueryOptions } from '@/features/auth/api/queries';

const PROFILE_PATH = '/dashboard/portal/profile';
export const CHANGE_PASSWORD_PATH = `${PROFILE_PATH}?tab=security`;
/** Still open while the password is temporary: a partner stuck here may need help. */
const ALWAYS_OPEN_PATHS = ['/dashboard/portal/support'];

function useMustChangePassword(): boolean {
  const { data: me } = useQuery(authMeQueryOptions);
  return Boolean(me?.mustChangePassword);
}

function Redirect() {
  const mustChange = useMustChangePassword();
  const router = useRouter();
  const pathname = usePathname();
  const tab = useSearchParams().get('tab');

  useEffect(() => {
    if (!mustChange) return;
    if (ALWAYS_OPEN_PATHS.some((path) => pathname.startsWith(path))) return;
    if (pathname === PROFILE_PATH && tab === 'security') return;
    router.replace(CHANGE_PASSWORD_PATH);
  }, [mustChange, pathname, tab, router]);

  return null;
}

/** Mounted once in the portal's layout. */
export function MustChangePasswordRedirect() {
  return (
    <Suspense fallback={null}>
      <Redirect />
    </Suspense>
  );
}

/** The notice above the profile page. */
export function MustChangePasswordGate() {
  const mustChange = useMustChangePassword();
  if (!mustChange) return null;

  return (
    <div className='border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200 mb-4 rounded-lg border p-3 text-sm'>
      <p className='font-medium'>Bạn cần đổi mật khẩu để tiếp tục</p>
      <p className='mt-1 text-xs'>
        Tài khoản của bạn đang dùng mật khẩu tạm thời do hệ thống gửi qua email. Hãy đặt mật khẩu
        của riêng bạn ngay bên dưới; xong là dùng được mọi mục của cổng đối tác.
      </p>
    </div>
  );
}
