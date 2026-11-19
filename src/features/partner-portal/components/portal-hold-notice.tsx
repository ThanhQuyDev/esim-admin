'use client';

/**
 * "Tài khoản đang bị tạm khoá…" at the top of a partner's main pages.
 *
 * - Distribution partner (doitac-0911 #023): Tổng quan, Thanh toán, Sản phẩm &
 *   bảng giá, Quản lý eSIM and Đơn hàng. Before, the partner only found out
 *   when "Đặt mua" failed — with a message saying the account was never
 *   activated.
 * - Marketing partner (vande-2011 #024): Tổng quan, Link tiếp thị, Mã giảm
 *   giá, Đơn hàng and Thanh toán, with what a hold stops for them.
 */

import { useQuery } from '@tanstack/react-query';

import { Icons } from '@/components/icons';

import { myProfileQueryOptions } from '../api/queries';

export function PortalHoldNotice() {
  const { data: me } = useQuery(myProfileQueryOptions());
  if (!me || me.status !== 'hold') return null;
  const marketing = me.partnerType === 'kol';
  return (
    <div
      role='alert'
      className='flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200'
      data-testid='portal-hold-notice'
    >
      <Icons.warning className='mt-0.5 size-4 shrink-0' />
      {marketing ? (
        <p>
          <span className='font-semibold'>Tài khoản đang bị tạm khoá</span> nên không thể ghi nhận
          hoa hồng cho đơn hàng mới, tạo link tiếp thị, mã giảm giá hay yêu cầu rút tiền. Vui lòng
          liên hệ admin để được hỗ trợ.
        </p>
      ) : (
        <p>
          <span className='font-semibold'>Tài khoản đang bị tạm khoá</span> nên không thể đặt mua
          eSIM, topup, nạp tiền hay rút tiền. Vui lòng liên hệ admin để được hỗ trợ.
        </p>
      )}
    </div>
  );
}
