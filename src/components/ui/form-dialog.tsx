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
  extraActions?: React.ReactNode;
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
  extraActions,
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
        // A flex column (#049, test round 4): the body takes what is left and
        // scrolls, so the action buttons can never be pushed out of the dialog.
        // The body's height used to assume a fixed 220px header + footer, and a
        // long script or a wrapped title clipped the buttons. `sm:` because the
        // base dialog's sm:max-w-lg otherwise wins and squeezes the form.
        className={cn(
          'flex max-h-[92vh] max-w-4xl flex-col gap-0 overflow-hidden p-0 shadow-2xl sm:max-w-3xl',
          className
        )}
      >
        {/* Decorative top border */}
        <div className='absolute inset-x-0 top-0 h-1 bg-primary' />

        <DialogHeader className='relative shrink-0 px-8 pt-8 pb-6 space-y-3'>
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
        <ScrollArea className='min-h-0 flex-1 px-8 py-6'>{children}</ScrollArea>

        {/* Divider */}
        <div className='h-px bg-gradient-to-r from-transparent via-border to-transparent' />

        <DialogFooter className='shrink-0 flex-col items-stretch gap-3 px-8 py-5 bg-background sm:flex-col sm:space-x-0'>
          <div className='flex flex-wrap items-center justify-end gap-3'>
            {extraActions}
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
          <p className='text-xs text-muted-foreground/60'>
            Tất cả các trường có dấu <span className='text-destructive'>*</span> là bắt buộc
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
