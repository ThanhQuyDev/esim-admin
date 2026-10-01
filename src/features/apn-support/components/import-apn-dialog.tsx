'use client';

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { importApnExcelMutation } from '../api/mutations';

/**
 * Upload the APN sheet (#065).
 *
 * The upload REPLACES the whole table, which is what the team asked for — a sheet
 * is the authoritative list as of that moment. Because that is destructive, the
 * dialog says so plainly before the button is pressed rather than afterwards.
 */
export function ImportApnDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  const mutation = useMutation({
    ...importApnExcelMutation,
    onSuccess: (result) => {
      const extra = result.duplicates.length
        ? ` Bỏ qua ${result.duplicates.length} APN trùng: ${result.duplicates.slice(0, 5).join(', ')}${result.duplicates.length > 5 ? '…' : ''}`
        : '';
      toast.success(`Đã nạp ${result.total} APN.${extra}`);
      onOpenChange(false);
      setFile(null);
    },
    onError: (error) => toast.error(error.message || 'Nhập file thất bại')
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nạp file APN</DialogTitle>
          <DialogDescription>
            File cần có các cột tiêu đề: <b>APN</b>, <b>TikTok iPhone</b>, <b>TikTok Android</b>,{' '}
            <b>ChatGPT</b> (thêm cột ghi chú nếu muốn). Cột được tìm theo tên tiêu đề nên thứ tự cột
            không quan trọng.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900'>
            Nạp file mới sẽ <b>thay toàn bộ</b> bảng APN hiện tại. APN không có trong file mới sẽ bị
            xoá, và gói eSIM dùng APN đó sẽ không còn được hiện là dùng được TikTok/ChatGPT.
          </div>

          <div className='flex items-center gap-3'>
            <Button type='button' variant='outline' onClick={() => inputRef.current?.click()}>
              <Icons.upload className='mr-2 h-4 w-4' /> Chọn file .xlsx
            </Button>
            <span className='text-muted-foreground text-sm'>
              {file ? file.name : 'Chưa chọn file'}
            </span>
          </div>

          <input
            ref={inputRef}
            type='file'
            accept='.xlsx,.xls'
            className='hidden'
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              event.target.value = '';
            }}
          />
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button
            disabled={!file || mutation.isPending}
            onClick={() => file && mutation.mutate(file)}
          >
            {mutation.isPending ? 'Đang nạp…' : 'Nạp và thay bảng'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ImportApnDialogTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} size='sm'>
        <Icons.upload className='mr-2 h-4 w-4' /> Nạp file APN
      </Button>
      <ImportApnDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
