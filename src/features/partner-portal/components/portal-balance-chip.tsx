'use client';

/**
 * A distribution partner's deposit balance, in the top bar beside the search
 * and the theme switch (doitac-1410 #006) — so it is in view on every page,
 * and the price list no longer needs a row of cards above it.
 */

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { Icons } from '@/components/icons';
import { formatVnd } from '@/lib/format';

import { myProfileQueryOptions, myWalletQueryOptions } from '../api/queries';

export function PortalBalanceChip() {
  const { data: me } = useQuery(myProfileQueryOptions());
  const isDistribution = me?.partnerType === 'distribution';
  const { data: wallet } = useQuery({ ...myWalletQueryOptions(), enabled: isDistribution });

  if (!isDistribution) return null;

  const frozen = wallet?.status === 'locked';
  return (
    <Link
      href='/dashboard/portal/wallet'
      className='hover:bg-muted flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm'
      title={frozen ? 'Ví ký quỹ đang bị tạm khóa' : 'Số dư ví ký quỹ — bấm để nạp thêm'}
      data-testid='portal-balance'
    >
      <Icons.wallet className='text-muted-foreground size-4' />
      <span className='text-muted-foreground hidden lg:inline'>Số dư</span>
      <span className={`font-semibold tabular-nums ${frozen ? 'text-destructive' : ''}`}>
        {wallet ? formatVnd(wallet.availableBalanceVnd) : '…'}
      </span>
    </Link>
  );
}
