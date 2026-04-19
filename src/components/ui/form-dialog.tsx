'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  formId: string;
  isLoading?: boolean;
  onCancel?: () => void;
  submitLabel?: string;
  metaInfo?: React.ReactNode;
  className?: string;
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  formId,
  isLoading = false,
  onCancel,
  submitLabel = 'Lưu',
  metaInfo,
  className
}: FormDialogProps) {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn('max-w-4xl max-h-[92vh] p-0 gap-0 overflow-hidden shadow-2xl', className)}
      >
        {/* Decorative top border */}
        <div className='absolute inset-x-0 top-0 h-1 bg-primary' />

        <DialogHeader className='relative px-8 pt-8 pb-6 space-y-3'>
          <div className='flex items-start justify-between'>
            <div className='space-y-2 flex-1'>
              <DialogTitle className='text-3xl font-bold tracking-tight'>{title}</DialogTitle>
              {description && (
                <DialogDescription className='text-base text-muted-foreground/80'>
                  {description}
                </DialogDescription>
              )}
            </div>
            {metaInfo && (
              <div className='flex items-center gap-2 text-xs text-muted-foreground/60 font-medium'>
                {metaInfo}
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Divider */}
        <div className='h-px bg-gradient-to-r from-transparent via-border to-transparent' />

        {/* Scrollable content */}
        <ScrollArea className='max-h-[calc(92vh-220px)] px-8 py-6'>{children}</ScrollArea>

        {/* Divider */}
        <div className='h-px bg-gradient-to-r from-transparent via-border to-transparent' />

        <DialogFooter className='px-8 py-5 bg-muted/20 backdrop-blur-sm'>
          <div className='flex items-center justify-between w-full gap-3'>
            <p className='text-xs text-muted-foreground/60'>
              Tất cả các trường có dấu <span className='text-destructive'>*</span> là bắt buộc
            </p>
            <div className='flex gap-3'>
              <Button
                type='button'
                variant='outline'
                onClick={handleCancel}
                className='min-w-[100px]'
                disabled={isLoading}
              >
                Hủy
              </Button>
              <Button type='submit' form={formId} isLoading={isLoading} className='min-w-[140px]'>
                <Icons.check className='mr-2 h-4 w-4' /> {submitLabel}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
