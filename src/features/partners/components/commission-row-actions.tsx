'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { AlertModal } from '@/components/modal/alert-modal';
import { Icons } from '@/components/icons';
import { formatVnd } from '@/lib/format';
import { apiClient } from '@/lib/api-client';

import { partnerKeys } from '../api/queries';
import type { OrderPartnerCommission } from '../api/types';

/**
 * The "…" on a commission row (vande-1411 #048), for one stuck at "chờ
 * duyệt": "Duyệt hoa hồng" credits it to the wallet now, "Xoá hoa hồng" makes
 * it 0đ ("Bị loại hoa hồng", the partner reads "Admin từ chối chi trả hoa
 * hồng"). Money moves, so each asks first, runs once (the buttons lock while
 * it runs) and the API asks for the sales password (#004).
 */
export function CommissionRowActions({ commission }: { commission: OrderPartnerCommission }) {
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState<'credit' | 'reject' | null>(null);
  const waiting = commission.status === 'pending';
  const removable = waiting || commission.status === 'unpaid';

  const decide = useMutation({
    mutationFn: (action: 'credit' | 'reject') =>
      apiClient(`/partners/commissions/${commission.id}/${action}`, { method: 'PATCH' }),
    onSuccess: (_r, action) => {
      toast.success(
        action === 'credit'
          ? `Đã cộng ${formatVnd(commission.commissionVnd)} vào ví đối tác.`
          : 'Đã xoá hoa hồng của đơn này.'
      );
      setConfirm(null);
      void queryClient.invalidateQueries({ queryKey: partnerKeys.all });
    },
    onError: (e: Error) => toast.error(e.message || 'Không xử lý được hoa hồng.')
  });

  if (!removable) return null;

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='h-8 w-8 p-0'
            aria-label='Thao tác hoa hồng'
            data-testid={`commission-actions-${commission.id}`}
          >
            <Icons.ellipsis className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          {waiting && (
            <DropdownMenuItem
              onClick={() => setConfirm('credit')}
              data-testid={`commission-credit-${commission.id}`}
            >
              <Icons.check className='mr-2 h-4 w-4' /> Duyệt hoa hồng
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className='text-destructive'
            onClick={() => setConfirm('reject')}
            data-testid={`commission-reject-${commission.id}`}
          >
            <Icons.trash className='mr-2 h-4 w-4' /> Xoá hoa hồng
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertModal
        isOpen={confirm !== null}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && !decide.isPending && decide.mutate(confirm)}
        loading={decide.isPending}
        title={
          confirm === 'credit'
            ? `Duyệt ${formatVnd(commission.commissionVnd)} hoa hồng?`
            : 'Xoá hoa hồng của đơn này?'
        }
        description={
          confirm === 'credit'
            ? 'Số tiền được cộng ngay vào ví của đối tác, trạng thái thành "Đã cộng vào ví".'
            : 'Hoa hồng về 0đ, trạng thái "Bị loại hoa hồng". Đối tác thấy lý do "Admin từ chối chi trả hoa hồng".'
        }
      />
    </>
  );
}
