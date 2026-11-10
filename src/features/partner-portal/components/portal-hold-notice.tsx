'use client';

/**
 * "Tài khoản đang bị tạm khoá…" at the top of a distribution partner's main
 * pages (doitac-0911 #023): Tổng quan, Thanh toán, Sản phẩm & bảng giá, Quản
 * lý eSIM and Đơn hàng. Before, the partner only found out when "Đặt mua"
 * failed — with a message saying the account was never activated.
 */

import { useQuery } from '@tanstack/react-query';

import { Icons } from '@/components/icons';

import { myProfileQueryOptions } from '../api/queries';

export function PortalHoldNotice() {
  const { data: me } = useQuery(myProfileQueryOptions());
  if (me?.partnerType !== 'distribution' || me.status !== 'hold') return null;
  return (
    <div
      role='alert'
      className='flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200'
      data-testid='portal-hold-notice'
    >
      <Icons.warning className='mt-0.5 size-4 shrink-0' />
      <p>
        <span className='font-semibold'>Tài khoản đang bị tạm khoá</span> nên không thể đặt mua
        eSIM, topup, nạp tiền hay rút tiền. Vui lòng liên hệ admin để được hỗ trợ.
      </p>
    </div>
  );
}
