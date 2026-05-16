'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { AlertModal } from '@/components/modal/alert-modal';
import type { Esim } from '../../api/types';
import { Icons } from '@/components/icons';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { deleteEsimMutation } from '../../api/mutations';
import { toast } from 'sonner';
import { EsimFormDialog } from '../esim-form-dialog';

interface CellActionProps {
  data: Esim;
}

export function CellAction({ data }: CellActionProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { mutate: deleteMutate, isPending: isDeleting } = useMutation({
    ...deleteEsimMutation,
    onSuccess: () => {
      toast.success('Xoá eSIM thành công');
      setDeleteOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Xoá eSIM thất bại');
    }
  });

  return (
    <>
      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutate(data.id)}
        loading={isDeleting}
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
          <DropdownMenuItem onClick={() => router.push(`/dashboard/esims/${data.id}`)}>
            <Icons.eye className='mr-2 h-4 w-4' /> Xem chi tiết
          </DropdownMenuItem>
          <EsimFormDialog
            esim={data}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Icons.edit className='mr-2 h-4 w-4' /> Sửa
              </DropdownMenuItem>
            }
          />
          <DropdownMenuSeparator />
          <DropdownMenuItem className='text-destructive' onClick={() => setDeleteOpen(true)}>
            <Icons.trash className='mr-2 h-4 w-4' /> Xoá
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
