'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import type { Partner } from '../../api/types';
import { Icons } from '@/components/icons';
import Link from 'next/link';

interface CellActionProps {
  data: Partner;
}

export function PartnerCellAction({ data }: CellActionProps) {
  return (
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
