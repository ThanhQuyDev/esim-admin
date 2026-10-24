'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { AlertModal } from '@/components/modal/alert-modal';
import { bulkDeletePlansMutation } from '../api/mutations';

/** Delete every plan ticked in the list at once (vande #019). */
export function BulkDeletePlansButton({
  selectedIds,
  onSuccess
}: {
  selectedIds: number[];
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const mutation = useMutation({
    ...bulkDeletePlansMutation,
    onSuccess: (res) => {
      toast.success(`Đã xoá ${res.deleted} gói eSIM.`);
      setOpen(false);
      onSuccess?.();
    },
    onError: (e) => toast.error(e.message || 'Không xoá được các gói đã chọn')
  });

  return (
    <>
      <Button
        variant='outline'
        size='sm'
        className='text-destructive'
        disabled={selectedIds.length === 0}
        onClick={() => setOpen(true)}
        data-testid='plans-bulk-delete'
      >
        <Icons.trash className='mr-2 h-4 w-4' />
        Xoá đã chọn ({selectedIds.length})
      </Button>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        loading={mutation.isPending}
        onConfirm={() => mutation.mutate(selectedIds)}
        title={`Xoá ${selectedIds.length} gói eSIM?`}
        description='Các gói sẽ bị xoá khỏi danh sách và ngừng bán. Đơn hàng cũ vẫn giữ thông tin gói.'
      />
    </>
  );
}
