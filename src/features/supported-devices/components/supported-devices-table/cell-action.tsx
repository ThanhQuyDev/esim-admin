'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { deleteSupportedDeviceMutation, supportedDeviceKeys } from '../../api/queries';
import { SupportedDeviceFormDialog } from '../supported-device-form-dialog';
import type { SupportedDevice } from '../../api/types';

interface CellActionProps {
  data: SupportedDevice;
}

export function CellAction({ data }: CellActionProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    ...deleteSupportedDeviceMutation,
    onSuccess: () => {
      toast.success('Xóa thiết bị thành công');
      setDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: supportedDeviceKeys.all });
    },
    onError: () => {
      toast.error('Xóa thiết bị thất bại');
    }
  });

  return (
    <>
      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate(data.id)}
        loading={deleteMutation.isPending}
      />
      <SupportedDeviceFormDialog device={data} open={editOpen} onOpenChange={setEditOpen} />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Mở menu</span>
            <Icons.ellipsis className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Icons.edit className='mr-2 h-4 w-4' /> Cập nhật
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDeleteOpen(true)}>
            <Icons.trash className='mr-2 h-4 w-4' /> Xóa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
