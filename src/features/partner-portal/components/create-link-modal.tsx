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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import type { CreateLinkPayload } from '../api/types';

interface CreateLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateLinkPayload) => void;
  isSubmitting: boolean;
}

export function CreateLinkModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting
}: CreateLinkModalProps) {
  const [label, setLabel] = useState('');
  const [targetPath, setTargetPath] = useState('');

  const isValid = label.trim() !== '';

  function handleSubmit() {
    if (!isValid) return;
    onSubmit({ label: label.trim(), targetPath: targetPath.trim() || undefined });
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      setLabel('');
      setTargetPath('');
    }
    onOpenChange(newOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-[420px]'>
        <DialogHeader>
          <DialogTitle>Tạo link tiếp thị</DialogTitle>
          <DialogDescription>
            Mỗi link có mã riêng biệt để theo dõi click và đơn hàng. Chia sẻ link này với người theo
            dõi của bạn.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='label'>Tên chiến dịch *</Label>
            <Input
              id='label'
              placeholder='VD: TikTok tháng 9'
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='targetPath'>Trang đích (tùy chọn)</Label>
            <Input
              id='targetPath'
              placeholder='VD: /khuyen-mai/sim-nhat-ban (để trống = trang chủ)'
              value={targetPath}
              onChange={(e) => setTargetPath(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => handleOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            isLoading={isSubmitting}
          >
            Tạo link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
