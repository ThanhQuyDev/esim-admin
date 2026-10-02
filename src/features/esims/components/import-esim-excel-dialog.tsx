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
import type { EsimKind, ImportEsimsExcelResponse } from '../api/types';

/**
 * Hai loại eSIM của nhà mạng trong nước phải nhập riêng (#esim-noi-dia).
 *
 * Loại nằm ở nút người dùng bấm, không suy ra từ tên nhà mạng: Viettel hôm nay
 * chỉ bán gói du lịch, nhưng cùng một nhà mạng có thể bán cả hai loại. Gợi ý
 * nhà mạng cũng khác nhau theo loại, nhưng ô nhập vẫn nhận tên tự do để nhà
 * mạng mới không cần sửa code.
 */
const KIND_COPY: Record<
  EsimKind,
  {
    button: string;
    title: string;
    description: string;
    carriers: string[];
    placeholder: string;
  }
> = {
  domestic: {
    button: 'Import eSIM nội địa',
    title: 'Import eSIM nội địa từ Excel',
    description:
      'SIM data dùng trong nước. Gói nhập ở đây hiện trong tab "eSIM nội địa" ở trang chủ và có trang riêng cho từng nhà mạng.',
    carriers: ['Wintel', 'iTEL', 'VNSKY'],
    placeholder: 'VD: Wintel, iTEL, VNSKY'
  },
  travel: {
    button: 'Import eSIM du lịch (nhà mạng VN)',
    title: 'Import eSIM du lịch của nhà mạng trong nước',
    description:
      'eSIM cho khách đi nước ngoài do nhà mạng Việt Nam bán. Gói nhập ở đây hiện trong tab Quốc gia → Việt Nam cùng các gói du lịch khác, KHÔNG vào tab eSIM nội địa.',
    carriers: ['Viettel'],
    placeholder: 'VD: Viettel'
  }
};

export function ImportEsimExcelDialog({ kind }: { kind: EsimKind }) {
  const copy = KIND_COPY[kind];
  // Hai dialog cùng nằm trên thanh công cụ của trang eSIM, nên id phải khác
  // nhau: trùng id thì label bấm vào sẽ nhảy sang ô của dialog kia và datalist
  // gợi ý sai nhà mạng.
  const ids = {
    carrier: `esim-carrier-${kind}`,
    carrierOptions: `esim-carrier-options-${kind}`,
    file: `esim-file-${kind}`
  };
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

    mutate({ file, provider, esimKind: kind });
  }, [carrier, file, kind, mutate]);

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
            {copy.button}
          </Button>
        </DialogTrigger>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>{copy.title}</DialogTitle>
            <DialogDescription>
              {copy.description} Nhà mạng nhập ở đây áp dụng cho mọi dòng và ghi đè cột Carrier
              trong file.
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 py-4'>
            {/* Carrier */}
            <div className='grid gap-2'>
              <Label htmlFor={ids.carrier}>
                Nhà mạng <span className='text-destructive'>*</span>
              </Label>
              <Input
                id={ids.carrier}
                list={ids.carrierOptions}
                placeholder={copy.placeholder}
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                disabled={isPending}
                autoComplete='off'
              />
              <datalist id={ids.carrierOptions}>
                {copy.carriers.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              <p className='text-muted-foreground text-xs'>
                Chọn nhà mạng có sẵn hoặc gõ tên nhà mạng mới.
              </p>
            </div>

            {/* File */}
            <div className='grid gap-2'>
              <Label htmlFor={ids.file}>
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
                id={ids.file}
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
