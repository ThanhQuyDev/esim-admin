'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import type { WalletListItem } from '../../api/types';
import { Icons } from '@/components/icons';
import { useState } from 'react';
import { WalletDetailSheet } from '../wallet-detail-sheet';

interface CellActionProps {
  data: WalletListItem;
}

export function WalletCellAction({ data }: CellActionProps) {
  const [detailUserId, setDetailUserId] = useState<number | null>(null);
  const detailOpen = detailUserId !== null;

  return (
    <>
      {detailUserId !== null && (
        <WalletDetailSheet
          userId={detailUserId}
          open={detailOpen}
          onOpenChange={(open) => {
            if (!open) setDetailUserId(null);
          }}
        />
      )}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Mở menu</span>
            <Icons.ellipsis className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setDetailUserId(data.userId)}>
            <Icons.eye className='mr-2 h-4 w-4' /> Xem chi tiết
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
