'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import type { Order } from '../../api/types';
import { Icons } from '@/components/icons';
import { useRouter } from 'next/navigation';

interface CellActionProps {
  data: Order;
}

export function CellAction({ data }: CellActionProps) {
  const router = useRouter();

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
        <DropdownMenuItem onClick={() => router.push(`/dashboard/orders/${data.id}`)}>
          <Icons.eye className='mr-2 h-4 w-4' /> Xem chi tiết
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
