'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { importEsimsExcelMutation } from '../api/mutations';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ImportEsimResultDialog } from './import-esim-result-dialog';
import type { ImportEsimsExcelResponse } from '../api/types';

/** Carriers already sold as local eSIM; the field still accepts any other name. */
const KNOWN_LOCAL_CARRIERS = ['Viettel', 'Wintel', 'iTEL', 'VNSKY'];

export function ImportEsimExcelDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [carrier, setCarrier] = useState('');
  const [importResult, setImportResult] = useState<ImportEsimsExcelResponse | null>(null);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate, isPending } = useMutation({
    ...importEsimsExcelMutation,
    onSuccess: (data, variables) => {
      toast.success(
        `Import eSIM ${variables.provider} hoàn tất: ${data.created} tạo mới, ${data.skipped} bỏ qua, ${data.planCreated} plan tạo mới`
      );
      handleReset();
      setOpen(false);
      setImportResult(data);
      setResultDialogOpen(true);
    },
    onError: (error) => {
      toast.error(error.message || 'Import thất bại');
    }
  });

  const handleReset = useCallback(() => {
    setFile(null);
    setCarrier('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

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
  }, []);

  const handleSubmit = useCallback(() => {
    const provider = carrier.trim();
    if (!provider) {
      toast.error('Vui lòng nhập tên nhà mạng');
      return;
    }
    if (!file) {
      toast.error('Vui lòng chọn file Excel');
      return;
    }

    mutate({ file, provider });
  }, [carrier, file, mutate]);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) handleReset();
          setOpen(v);
        }}
      >
        <DialogTrigger asChild>
          <Button variant='outline' size='sm'>
            <Icons.upload className='mr-2 h-4 w-4' />
            Import eSIM local
          </Button>
        </DialogTrigger>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Import eSIM local từ Excel</DialogTitle>
            <DialogDescription>
              Dùng chung file mẫu với eSIM Viettel. Nhà mạng nhập ở đây áp dụng cho mọi dòng và ghi
              đè cột Carrier trong file.
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 py-4'>
            {/* Carrier */}
            <div className='grid gap-2'>
              <Label htmlFor='esim-carrier'>
                Nhà mạng <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='esim-carrier'
                list='esim-carrier-options'
                placeholder='VD: Viettel, Wintel, iTEL, VNSKY'
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                disabled={isPending}
                autoComplete='off'
              />
              <datalist id='esim-carrier-options'>
                {KNOWN_LOCAL_CARRIERS.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              <p className='text-muted-foreground text-xs'>
                Chọn nhà mạng có sẵn hoặc gõ tên nhà mạng mới.
              </p>
            </div>

            {/* File */}
            <div className='grid gap-2'>
              <Label htmlFor='esim-file'>
                File Excel <span className='text-destructive'>*</span>
              </Label>
              <div
                role='button'
                tabIndex={0}
                aria-label='Chọn file Excel'
                className={cn(
                  'border-input hover:border-ring focus-visible:ring-ring flex cursor-pointer items-center gap-3 rounded-md border border-dashed p-3 transition-colors focus-visible:ring-2 focus-visible:outline-none',
                  file && 'border-primary'
                )}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <Icons.upload className='text-muted-foreground h-5 w-5 shrink-0' />
                <div className='min-w-0 flex-1'>
                  {file ? (
                    <div className='flex items-center gap-2'>
                      <span className='truncate text-sm font-medium'>{file.name}</span>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        className='h-auto shrink-0 p-1'
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                      >
                        <Icons.close className='h-3 w-3' />
                      </Button>
                    </div>
                  ) : (
                    <span className='text-muted-foreground text-sm'>Chọn file .xlsx hoặc .xls</span>
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                id='esim-file'
                type='file'
                accept='.xlsx,.xls'
                className='hidden'
                onChange={handleFileChange}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setOpen(false)} disabled={isPending}>
              Huỷ
            </Button>
            <Button onClick={handleSubmit} isLoading={isPending}>
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImportEsimResultDialog
        open={resultDialogOpen}
        onOpenChange={setResultDialogOpen}
        result={importResult}
      />
    </>
  );
}
