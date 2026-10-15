'use client';

/**
 * The actions on a partner row (#060).
 *
 * "Xem chi tiết / Tạm khoá / Khoá tài khoản / Điều chỉnh Ví & Hoa hồng" — and
 * every one of the last three asks for a reason before it does anything, which
 * is the point the brief makes twice: "bắt buộc nhập lý do để lần sau còn biết
 * vấn đề/sự việc". Unlocking is the exception; giving access back explains
 * itself.
 */

import { useState } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/icons';

import type { Partner, PartnerStatus } from '../../api/types';
import { BulkStatusModal } from '../bulk-status-modal';
import { PartnerWalletSheet } from '../partner-wallet-sheet';

interface CellActionProps {
  data: Partner;
}

export function PartnerCellAction({ data }: CellActionProps) {
  // The bulk dialog takes a list of ids, so a single row is a list of one —
  // one screen to keep in step rather than two that must agree about when a
  // reason is required.
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<PartnerStatus>('hold');
  const openStatus = (target: PartnerStatus) => {
    setStatusTarget(target);
    setStatusOpen(true);
  };
  const [walletOpen, setWalletOpen] = useState(false);

  const isLocked = data.status === 'hold' || data.status === 'disabled';

  return (
    <>
      <BulkStatusModal
        open={statusOpen}
        onOpenChange={setStatusOpen}
        partnerIds={[data.id]}
        initialStatus={statusTarget}
      />
      {/* Info + history tabs, like the eXu wallet (doitac-1410 #004). */}
      <PartnerWalletSheet
        partnerId={data.id}
        partnerType={data.partnerType}
        partnerStatus={data.status}
        open={walletOpen}
        onOpenChange={setWalletOpen}
      />

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Mở menu</span>
            <Icons.ellipsis className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/partners/${data.id}`}>
              <Icons.eye className='mr-2 h-4 w-4' /> Xem chi tiết
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {/*
            One button per action, as the brief lists them (doitac-1410 #003):
            "Mở khoá" only shows while the partner is held or locked.
          */}
          {isLocked && (
            <DropdownMenuItem onClick={() => openStatus('active')}>
              <Icons.check className='mr-2 h-4 w-4' /> Mở khoá
            </DropdownMenuItem>
          )}
          {data.status !== 'hold' && (
            <DropdownMenuItem onClick={() => openStatus('hold')}>
              <Icons.pause className='mr-2 h-4 w-4' /> Tạm khoá
            </DropdownMenuItem>
          )}
          {data.status !== 'disabled' && (
            <DropdownMenuItem onClick={() => openStatus('disabled')} className='text-destructive'>
              <Icons.lock className='mr-2 h-4 w-4' /> Khoá tài khoản
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setWalletOpen(true)}>
            <Icons.wallet className='mr-2 h-4 w-4' /> Điều chỉnh Ví & Hoa hồng
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
