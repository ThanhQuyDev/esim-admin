'use client';

/**
 * Make a partner replace the password an admin emailed them (#059).
 *
 * The account was created by hand and its password travelled through an inbox,
 * so it is not really theirs until they choose one. The brief asks for exactly
 * this: "khi đăng nhập lần đầu bằng mật khẩu ngẫu nhiên thì hệ thống sẽ yêu cầu
 * thay đổi mật khẩu đăng nhập để tiếp tục sử dụng dịch vụ".
 *
 * A banner and a redirect rather than a hard block: the profile page is where
 * the change is made, so sending them there and saying why is the whole job.
 * The flag clears itself the moment the new password is saved, which is what
 * lets them back out to the rest of the portal.
 */

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import { authMeQueryOptions } from '@/features/auth/api/queries';

const PROFILE_PATH = '/dashboard/portal/profile';

export function MustChangePasswordGate() {
  const { data: me } = useQuery(authMeQueryOptions);
  const router = useRouter();
  const pathname = usePathname();

  const mustChange = Boolean(me?.mustChangePassword);

  useEffect(() => {
    if (!mustChange) return;
    if (pathname === PROFILE_PATH) return;
    router.replace(PROFILE_PATH);
  }, [mustChange, pathname, router]);

  if (!mustChange) return null;

  return (
    <div className='border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200 mb-4 rounded-lg border p-3 text-sm'>
      <p className='font-medium'>Bạn cần đổi mật khẩu để tiếp tục</p>
      <p className='mt-1 text-xs'>
        Tài khoản của bạn đang dùng mật khẩu tạm thời do hệ thống gửi qua email. Hãy đặt mật khẩu
        của riêng bạn ở mục &quot;Đổi mật khẩu&quot; bên dưới.
      </p>
    </div>
  );
}
