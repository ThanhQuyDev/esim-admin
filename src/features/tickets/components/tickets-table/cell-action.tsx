'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/icons';
import { deleteTicketMutation, updateTicketStatusMutation } from '../../api/mutations';
import { TICKET_STATUS_OPTIONS } from '../../constants/status';
import type { Ticket } from '../../api/types';

export function CellAction({ data }: { data: Ticket }) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteMutation = useMutation({
    ...deleteTicketMutation,
    onSuccess: () => {
      toast.success('Đã xóa ticket');
      setDeleteOpen(false);
    },
    onError: (e) => toast.error(e.message || 'Xóa thất bại')
  });

  const statusMutation = useMutation({
    ...updateTicketStatusMutation,
    onSuccess: () => toast.success('Đã cập nhật trạng thái'),
    onError: (e) => toast.error(e.message || 'Cập nhật thất bại')
  });

  return (
    <>
      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate(data.id)}
        loading={deleteMutation.isPending}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <Icons.ellipsis className='h-4 w-4' />
            <span className='sr-only'>Hành động</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Hành động</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => router.push(`/dashboard/tickets/${data.id}`)}>
            <Icons.eye className='mr-2 h-4 w-4' /> Xem chi tiết
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.edit className='mr-2 h-4 w-4' /> Đổi trạng thái
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {TICKET_STATUS_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  disabled={opt.value === data.status || statusMutation.isPending}
                  onClick={() =>
                    statusMutation.mutate({ id: data.id, values: { status: opt.value } })
                  }
                >
                  {opt.label}
                  {opt.value === data.status && <Icons.check className='ml-auto h-4 w-4' />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className='text-destructive focus:text-destructive'
          >
            <Icons.trash className='mr-2 h-4 w-4' /> Xóa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
