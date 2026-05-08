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
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <>
      <WalletDetailSheet userId={data.userId} open={detailOpen} onOpenChange={setDetailOpen} />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Mở menu</span>
            <Icons.ellipsis className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setDetailOpen(true)}>
            <Icons.eye className='mr-2 h-4 w-4' /> Xem chi tiết
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
