'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/icons';
import { deleteApnSupportMutation } from '../../api/mutations';
import type { ApnSupport } from '../../api/types';
import { ApnFormDialog } from '../apn-form-dialog';

/** Edit / delete one APN row (#044, test round 4). */
export function ApnRowActions({ row }: { row: ApnSupport }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const remove = useMutation({
    ...deleteApnSupportMutation,
    onSuccess: () => {
      toast.success(`Đã xóa APN ${row.apnLabel}`);
      setDeleteOpen(false);
    },
    onError: (e) => toast.error(e.message || 'Xóa thất bại')
  });

  return (
    <>
      <ApnFormDialog open={editOpen} onOpenChange={setEditOpen} row={row} />
      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => remove.mutate(row.id)}
        loading={remove.isPending}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0' data-testid={`apn-actions-${row.apn}`}>
            <Icons.ellipsis className='h-4 w-4' />
            <span className='sr-only'>Hành động</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Icons.edit className='mr-2 h-4 w-4' /> Sửa
          </DropdownMenuItem>
          <DropdownMenuItem className='text-destructive' onClick={() => setDeleteOpen(true)}>
            <Icons.trash className='mr-2 h-4 w-4' /> Xóa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
