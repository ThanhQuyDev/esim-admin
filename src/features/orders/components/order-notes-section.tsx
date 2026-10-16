'use client';

/**
 * "Ghi chú" and the refund history at the foot of "Thông tin đơn hàng"
 * (doitac-1410 #067): what admins noted on the order, and every refund with
 * its reason and the admin's own note — which used to be saved and shown
 * nowhere.
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTimeVn, formatVnd } from '@/lib/format';

import { orderKeys } from '../api/queries';
import { addOrderNote } from '../api/service';
import type { OrderNote, OrderRefundRecord } from '../api/types';

const REFUND_MODE: Record<string, string> = {
  wallet: 'Hoàn vào ví eXU',
  direct_bank: 'Chuyển khoản trực tiếp'
};

export function OrderNotesSection({
  orderId,
  notes,
  refunds
}: {
  orderId: number;
  notes: OrderNote[];
  refunds: OrderRefundRecord[];
}) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');
  const save = useMutation({
    mutationFn: () => addOrderNote(orderId, body.trim()),
    onSuccess: () => {
      toast.success('Đã lưu ghi chú.');
      setBody('');
      void queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
    },
    onError: (e: Error) => toast.error(e.message || 'Không lưu được ghi chú')
  });

  return (
    <div className='grid gap-6 border-t pt-4 md:col-span-2 md:grid-cols-2'>
      <div className='space-y-3' data-testid='order-notes'>
        <p className='text-sm font-semibold'>Ghi chú</p>
        <Textarea
          aria-label='Ghi chú đơn hàng'
          rows={3}
          maxLength={2000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder='Ghi lại thông tin cần lưu vết (chỉ admin xem được)'
        />
        <div className='flex justify-end'>
          <Button
            size='sm'
            disabled={body.trim().length < 2 || save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? 'Đang lưu…' : 'Lưu ghi chú'}
          </Button>
        </div>
        {notes.length === 0 ? (
          <p className='text-muted-foreground text-xs'>Chưa có ghi chú nào.</p>
        ) : (
          <ul className='space-y-2'>
            {notes.map((note) => (
              <li key={note.id} className='bg-muted/40 rounded-md p-2 text-sm'>
                <p className='whitespace-pre-wrap'>{note.body}</p>
                <p className='text-muted-foreground mt-1 text-xs'>
                  {note.by} · {formatDateTimeVn(note.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className='space-y-3' data-testid='order-refund-history'>
        <p className='text-sm font-semibold'>Lịch sử hoàn tiền</p>
        {refunds.length === 0 ? (
          <p className='text-muted-foreground text-xs'>Đơn chưa hoàn tiền lần nào.</p>
        ) : (
          <ul className='space-y-2'>
            {refunds.map((refund) => (
              <li key={refund.id} className='rounded-md border p-2 text-sm'>
                <div className='flex flex-wrap items-center gap-2'>
                  <span className='font-medium text-amber-600'>-{formatVnd(refund.amountVnd)}</span>
                  <Badge variant='outline'>{REFUND_MODE[refund.mode] ?? refund.mode}</Badge>
                  {refund.esimCount ? (
                    <span className='text-muted-foreground text-xs'>{refund.esimCount} eSIM</span>
                  ) : null}
                </div>
                <p className='mt-1'>
                  <span className='text-muted-foreground'>Lý do: </span>
                  {refund.reason || '—'}
                </p>
                <p>
                  <span className='text-muted-foreground'>Ghi chú admin: </span>
                  {refund.adminNote || '—'}
                </p>
                <p className='text-muted-foreground mt-1 text-xs'>
                  {refund.by ?? 'Admin'} · {formatDateTimeVn(refund.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
