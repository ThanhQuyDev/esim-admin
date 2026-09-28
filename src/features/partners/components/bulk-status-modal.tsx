'use client';

/**
 * "Thay đổi trạng thái" for the rows an admin ticked (#059).
 *
 * The reason is required for a hold or a lock and optional for unlocking, which
 * is the asymmetry the brief asks for: taking a partner's account away is the
 * decision somebody has to answer for a month later ("để lần sau còn biết vấn
 * đề/sự việc"), while giving it back explains itself.
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { bulkUpdatePartnerStatusMutation } from '../api/mutations';
import type { PartnerStatus } from '../api/types';

const STATUS_OPTIONS: { value: PartnerStatus; label: string; hint: string }[] = [
  {
    value: 'active',
    label: 'Đang hoạt động',
    hint: 'Mở lại toàn bộ chức năng của đối tác.'
  },
  {
    value: 'hold',
    label: 'Tạm khoá',
    hint: 'Đóng băng số dư và tạm dừng link/mã tiếp thị.'
  },
  {
    value: 'disabled',
    label: 'Khoá tài khoản',
    hint: 'Khoá mọi chức năng; đối tác không đăng nhập được nữa.'
  }
];

/** Taking access away needs a reason; giving it back does not. */
const needsReason = (status: PartnerStatus) => status === 'hold' || status === 'disabled';

export function BulkStatusModal({
  open,
  onOpenChange,
  partnerIds,
  onDone
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerIds: number[];
  onDone?: () => void;
}) {
  const [status, setStatus] = useState<PartnerStatus>('hold');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    ...bulkUpdatePartnerStatusMutation,
    onSuccess: (result) => {
      toast.success(
        result.skipped.length > 0
          ? `Đã đổi trạng thái ${result.updated} đối tác. ${result.skipped.length} dòng không tìm thấy.`
          : `Đã đổi trạng thái ${result.updated} đối tác.`
      );
      setReason('');
      setError(null);
      onOpenChange(false);
      onDone?.();
    },
    onError: (e: Error) => toast.error(e.message || 'Đổi trạng thái thất bại')
  });

  const submit = () => {
    if (needsReason(status) && !reason.trim()) {
      setError('Cần nhập lý do khi tạm khoá hoặc khoá tài khoản.');
      return;
    }
    mutation.mutate({
      ids: partnerIds,
      status,
      ...(reason.trim() && { reason: reason.trim() })
    });
  };

  const selected = STATUS_OPTIONS.find((option) => option.value === status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thay đổi trạng thái {partnerIds.length} đối tác</DialogTitle>
          <DialogDescription>
            Lý do được lưu vào lịch sử trạng thái của từng đối tác, để lần sau còn biết vì sao.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label>Trạng thái mới</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as PartnerStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selected && <p className='text-muted-foreground text-xs'>{selected.hint}</p>}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='bulkReason'>
              Lý do
              {needsReason(status) && <span className='text-destructive'> *</span>}
            </Label>
            <Textarea
              id='bulkReason'
              rows={3}
              placeholder='Ví dụ: nghi ngờ gian lận đơn hàng, đang chờ đối tác giải trình.'
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
            />
            {error && <p className='text-destructive text-xs'>{error}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button
            isLoading={mutation.isPending}
            variant={needsReason(status) ? 'destructive' : 'default'}
            onClick={submit}
          >
            Áp dụng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
