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
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

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

import { adjustPartnerWalletMutation } from '../../api/mutations';
import type { Partner } from '../../api/types';
import { AdjustPartnerWalletModal } from '../adjust-partner-wallet-modal';
import { BulkStatusModal } from '../bulk-status-modal';

interface CellActionProps {
  data: Partner;
}

export function PartnerCellAction({ data }: CellActionProps) {
  // The bulk dialog takes a list of ids, so a single row is a list of one —
  // one screen to keep in step rather than two that must agree about when a
  // reason is required.
  const [statusOpen, setStatusOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);

  const adjustMutation = useMutation({
    ...adjustPartnerWalletMutation,
    onSuccess: () => {
      toast.success('Đã điều chỉnh ví đối tác.');
      setWalletOpen(false);
    },
    onError: (e: Error) => toast.error(e.message || 'Điều chỉnh ví thất bại')
  });

  const isLocked = data.status === 'hold' || data.status === 'disabled';

  return (
    <>
      <BulkStatusModal open={statusOpen} onOpenChange={setStatusOpen} partnerIds={[data.id]} />
      <AdjustPartnerWalletModal
        partnerId={data.id}
        open={walletOpen}
        onOpenChange={setWalletOpen}
        onSubmit={(payload) => adjustMutation.mutate({ id: data.id, data: payload })}
        isSubmitting={adjustMutation.isPending}
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
          <DropdownMenuItem onClick={() => setStatusOpen(true)}>
            <Icons.settings className='mr-2 h-4 w-4' />
            {isLocked ? 'Mở khoá / đổi trạng thái' : 'Tạm khoá / Khoá tài khoản'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setWalletOpen(true)}>
            <Icons.wallet className='mr-2 h-4 w-4' /> Điều chỉnh Ví & Hoa hồng
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
