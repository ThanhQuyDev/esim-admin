'use client';

import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { useMutation } from '@tanstack/react-query';
import { importGadgetKoreaExcelMutation } from '../api/mutations';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function ImportGadgetKoreaExcelDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = useCallback(() => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const importMut = useMutation({
    ...importGadgetKoreaExcelMutation,
    onSuccess: (data) => {
      toast.success(data.message || `Import Gadget Korea thành công ${data.imported} gói`);
      handleReset();
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Import Gadget Korea thất bại');
    }
  });

  const handleSubmit = useCallback(() => {
    if (!file) {
      toast.error('Vui lòng chọn file Excel');
      return;
    }

    importMut.mutate({ file });
  }, [file, importMut]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      if (
        !validTypes.includes(selected.type) &&
        !selected.name.endsWith('.xlsx') &&
        !selected.name.endsWith('.xls')
      ) {
        toast.error('Chỉ chấp nhận file Excel (.xlsx, .xls)');
        return;
      }
      setFile(selected);
    }
  }, []);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) handleReset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant='outline' size='sm'>
          <Icons.upload className='mr-2 h-4 w-4' />
          Import Excel Gadget Korea
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Import Excel Gadget Korea</DialogTitle>
          <DialogDescription>
            Upload file Excel Gadget Korea. Không cần nhập provider, sheet hoặc mapping cột.
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-4 py-4'>
          <div className='grid gap-2'>
            <Label htmlFor='gadget-korea-excel-file'>
              File Excel <span className='text-destructive'>*</span>
            </Label>
            <div
              className={cn(
                'border-input hover:border-ring flex cursor-pointer items-center gap-3 rounded-md border border-dashed p-3 transition-colors',
                file && 'border-primary bg-primary/5'
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <Icons.fileTypeXls className='text-muted-foreground h-8 w-8' />
              <div className='flex-1'>
                {file ? (
                  <>
                    <p className='text-sm font-medium'>{file.name}</p>
                    <p className='text-muted-foreground text-xs'>
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </>
                ) : (
                  <p className='text-muted-foreground text-sm'>Nhấn để chọn file .xlsx hoặc .xls</p>
                )}
              </div>
              {file && (
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='h-6 w-6'
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  <Icons.close className='h-4 w-4' />
                </Button>
              )}
            </div>
            <input
              ref={fileInputRef}
              id='gadget-korea-excel-file'
              type='file'
              accept='.xlsx,.xls'
              className='hidden'
              onChange={handleFileChange}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)} disabled={importMut.isPending}>
            Huỷ
          </Button>
          <Button onClick={handleSubmit} isLoading={importMut.isPending} disabled={!file}>
            <Icons.upload className='mr-2 h-4 w-4' />
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
