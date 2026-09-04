'use client';
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
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import type { RejectPartnerPayload } from '../api/types';

interface RejectPartnerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RejectPartnerPayload) => void;
  isSubmitting: boolean;
}

export function RejectPartnerModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting
}: RejectPartnerModalProps) {
  const [reason, setReason] = useState('');

  function handleSubmit() {
    if (!reason.trim()) return;
    onSubmit({ reason: reason.trim() });
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) setReason('');
    onOpenChange(newOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-[450px]'>
        <DialogHeader>
          <DialogTitle>Từ chối đăng ký đối tác</DialogTitle>
          <DialogDescription>Nêu rõ lý do để đối tác biết cần bổ sung/sửa gì.</DialogDescription>
        </DialogHeader>

        <div className='space-y-2'>
          <Label htmlFor='reject-reason'>Lý do từ chối *</Label>
          <Textarea
            id='reject-reason'
            placeholder='Ví dụ: Thông tin doanh nghiệp chưa đầy đủ'
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
          />
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => handleOpenChange(false)}>
            Hủy
          </Button>
          <Button
            variant='destructive'
            onClick={handleSubmit}
            disabled={!reason.trim() || isSubmitting}
            isLoading={isSubmitting}
          >
            Từ chối
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
