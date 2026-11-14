'use client';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api-client';
import { deleteUserMutation, lockUserMutation, unlockUserMutation } from '../../api/mutations';
import type { User } from '../../api/types';
import { Icons } from '@/components/icons';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UserFormDialog } from '../user-form-dialog';

interface CellActionProps {
  data: User;
}

export function CellAction({ data }: CellActionProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const [reason, setReason] = useState('');
  const locked = Boolean(data.lockedAt);
  const isAdmin = data.role?.id === 1;

  // "Khoá tài khoản" (security 15/11/2026): signs the account out on every
  // device and refuses its sign-in until an admin unlocks it.
  const lockMutation = useMutation({
    ...lockUserMutation,
    onSuccess: () => {
      toast.success('Đã khoá tài khoản và đăng xuất trên mọi thiết bị');
      setLockOpen(false);
      setReason('');
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError && error.message ? error.message : 'Khoá tài khoản thất bại'
      );
    }
  });

  const unlockMutation = useMutation({
    ...unlockUserMutation,
    onSuccess: () => toast.success('Đã mở khoá tài khoản'),
    onError: () => toast.error('Mở khoá tài khoản thất bại')
  });

  const deleteMutation = useMutation({
    ...deleteUserMutation,
    onSuccess: () => {
      toast.success('Xóa người dùng thành công');
      setDeleteOpen(false);
    },
    onError: () => {
      toast.error('Xóa người dùng thất bại');
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
      <UserFormDialog user={data} open={editOpen} onOpenChange={setEditOpen} />
      <Dialog open={lockOpen} onOpenChange={setLockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Khoá tài khoản {data.email}</DialogTitle>
            <DialogDescription>
              Tài khoản bị đăng xuất trên mọi thiết bị và không đăng nhập lại được cho tới khi mở
              khoá. Lý do chỉ admin xem được.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder='Lý do khoá'
            maxLength={500}
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setLockOpen(false)}>
              Huỷ
            </Button>
            <Button
              variant='destructive'
              disabled={reason.trim().length < 3 || lockMutation.isPending}
              onClick={() => lockMutation.mutate({ id: data.id, reason: reason.trim() })}
            >
              Khoá tài khoản
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {locked && (
        <Badge variant='destructive' className='mr-1' title={data.lockReason ?? undefined}>
          Đã khoá
        </Badge>
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
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Icons.edit className='mr-2 h-4 w-4' /> Cập nhật
          </DropdownMenuItem>
          {locked ? (
            <DropdownMenuItem
              disabled={unlockMutation.isPending}
              onClick={() => unlockMutation.mutate(data.id)}
            >
              <Icons.lock className='mr-2 h-4 w-4' /> Mở khoá
            </DropdownMenuItem>
          ) : (
            !isAdmin && (
              <DropdownMenuItem onClick={() => setLockOpen(true)}>
                <Icons.lock className='mr-2 h-4 w-4' /> Khoá tài khoản
              </DropdownMenuItem>
            )
          )}
          <DropdownMenuItem onClick={() => setDeleteOpen(true)}>
            <Icons.trash className='mr-2 h-4 w-4' /> Xóa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
