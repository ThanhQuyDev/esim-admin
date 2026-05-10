'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '@/components/icons';
import type { ImportGadgetKoreaResponse } from '../api/types';

interface ImportResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: ImportGadgetKoreaResponse | null;
}

export function ImportResultDialog({ open, onOpenChange, result }: ImportResultDialogProps) {
  if (!result) return null;

  const hasErrors = result.errors.length > 0;
  const hasDestinationNotFound = result.destinationNotFound.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Icons.check className='h-5 w-5 text-green-500' />
            Import Gadget Korea hoàn tất
          </DialogTitle>
          <DialogDescription>Kết quả import file Excel Gadget Korea</DialogDescription>
        </DialogHeader>

        <div className='grid gap-4 py-4'>
          {/* Stats summary */}
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
            <StatCard label='Tổng' value={result.total} variant='default' />
            <StatCard label='Tạo mới' value={result.created} variant='success' />
            <StatCard label='Cập nhật' value={result.updated} variant='info' />
            <StatCard label='Bỏ qua' value={result.skipped} variant='warning' />
          </div>

          {/* Errors */}
          {hasErrors && (
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <Icons.warning className='h-4 w-4 text-red-500' />
                <span className='text-sm font-medium text-red-700 dark:text-red-400'>
                  Lỗi ({result.errors.length})
                </span>
              </div>
              <ScrollArea className='h-[120px] rounded-md border p-3'>
                <ul className='space-y-1'>
                  {result.errors.map((error, idx) => (
                    <li key={idx} className='text-sm text-red-600 dark:text-red-400'>
                      {error}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          )}

          {/* Destination Not Found */}
          {hasDestinationNotFound && (
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <Icons.info className='h-4 w-4 text-amber-500' />
                <span className='text-sm font-medium text-amber-700 dark:text-amber-400'>
                  Destination không tìm thấy ({result.destinationNotFound.length})
                </span>
              </div>
              <ScrollArea className='h-[160px] rounded-md border p-3'>
                <div className='flex flex-wrap gap-1.5'>
                  {result.destinationNotFound.map((dest) => (
                    <Badge key={dest} variant='outline' className='text-xs'>
                      {dest}
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({
  label,
  value,
  variant
}: {
  label: string;
  value: number;
  variant: 'default' | 'success' | 'info' | 'warning';
}) {
  const colorMap = {
    default: 'bg-muted text-foreground',
    success: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
    info: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
  };

  return (
    <div className={`rounded-lg p-3 text-center ${colorMap[variant]}`}>
      <p className='text-2xl font-bold'>{value.toLocaleString()}</p>
      <p className='text-xs opacity-80'>{label}</p>
    </div>
  );
}
