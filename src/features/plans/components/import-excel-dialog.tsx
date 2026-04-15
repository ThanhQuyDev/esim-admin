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
import { importPlansExcelMutation } from '../api/mutations';
import type { PlanColumnMapping } from '../api/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const COLUMN_MAPPING_FIELDS: {
  key: keyof PlanColumnMapping;
  label: string;
  placeholder: string;
  required?: boolean;
}[] = [
  {
    key: 'providerPlanId',
    label: 'Provider Plan ID',
    placeholder: 'e.g. Plan ID',
    required: true
  },
  {
    key: 'name',
    label: 'Plan Name',
    placeholder: 'e.g. Plan Name',
    required: true
  },
  {
    key: 'durationDays',
    label: 'Duration (Days)',
    placeholder: 'e.g. Duration'
  },
  {
    key: 'dataGb',
    label: 'Data (GB)',
    placeholder: 'e.g. Data (GB)'
  },
  {
    key: 'costPrice',
    label: 'Cost Price',
    placeholder: 'e.g. Cost'
  },
  {
    key: 'price',
    label: 'Price',
    placeholder: 'e.g. Price'
  },
  {
    key: 'retailPrice',
    label: 'Retail Price',
    placeholder: 'e.g. Retail Price'
  },
  {
    key: 'currency',
    label: 'Currency',
    placeholder: 'e.g. Currency'
  },
  {
    key: 'countryCode',
    label: 'Country Code',
    placeholder: 'e.g. Country'
  },
  {
    key: 'slug',
    label: 'Slug',
    placeholder: 'e.g. Slug'
  },
  {
    key: 'sms',
    label: 'SMS',
    placeholder: 'e.g. SMS'
  },
  {
    key: 'call',
    label: 'Call',
    placeholder: 'e.g. Call'
  },
  {
    key: 'type',
    label: 'Type',
    placeholder: 'e.g. Type'
  }
];

export function ImportExcelDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [provider, setProvider] = useState('');
  const [sheet, setSheet] = useState('');
  const [columnMapping, setColumnMapping] = useState<PlanColumnMapping>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importMut = useMutation({
    ...importPlansExcelMutation,
    onSuccess: (data) => {
      toast.success(data.message || `Import thành công ${data.imported} gói`);
      handleReset();
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Import thất bại');
    }
  });

  const handleReset = useCallback(() => {
    setFile(null);
    setProvider('');
    setSheet('');
    setColumnMapping({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleMappingChange = useCallback((key: keyof PlanColumnMapping, value: string) => {
    setColumnMapping((prev) => ({
      ...prev,
      [key]: value || undefined
    }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!file) {
      toast.error('Vui lòng chọn file Excel');
      return;
    }
    if (!provider.trim()) {
      toast.error('Vui lòng nhập tên provider');
      return;
    }

    const filledMapping = Object.fromEntries(Object.entries(columnMapping).filter(([, v]) => v));

    if (Object.keys(filledMapping).length === 0) {
      toast.error('Vui lòng nhập ít nhất một cột mapping');
      return;
    }

    importMut.mutate({
      file,
      provider: provider.trim(),
      columnMapping: filledMapping as PlanColumnMapping,
      ...(sheet.trim() && { sheet: sheet.trim() })
    });
  }, [file, provider, sheet, columnMapping, importMut]);

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
          Import Excel
        </Button>
      </DialogTrigger>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Import Plans từ Excel</DialogTitle>
          <DialogDescription>
            Upload file Excel và nhập tên cột tương ứng với từng field của Plan.
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-4 py-4'>
          {/* File Upload */}
          <div className='grid gap-2'>
            <Label htmlFor='excel-file'>
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
                  <>
                    <p className='text-muted-foreground text-sm'>
                      Nhấn để chọn file .xlsx hoặc .xls
                    </p>
                  </>
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
              id='excel-file'
              type='file'
              accept='.xlsx,.xls'
              className='hidden'
              onChange={handleFileChange}
            />
          </div>

          {/* Provider */}
          <div className='grid gap-2'>
            <Label htmlFor='provider'>
              Provider <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='provider'
              placeholder='e.g. esimaccess'
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            />
          </div>

          {/* Sheet */}
          <div className='grid gap-2'>
            <Label htmlFor='sheet'>Sheet (tuỳ chọn)</Label>
            <Input
              id='sheet'
              placeholder='Tên sheet hoặc index (mặc định: sheet đầu tiên)'
              value={sheet}
              onChange={(e) => setSheet(e.target.value)}
            />
          </div>

          {/* Column Mapping */}
          <div className='grid gap-2'>
            <Label className='text-base font-semibold'>Column Mapping</Label>
            <p className='text-muted-foreground text-sm'>
              Nhập tên cột trong file Excel tương ứng với từng field bên dưới.
            </p>
            <div className='grid gap-3 sm:grid-cols-2'>
              {COLUMN_MAPPING_FIELDS.map((field) => (
                <div key={field.key} className='grid gap-1.5'>
                  <Label htmlFor={`mapping-${field.key}`} className='text-muted-foreground text-xs'>
                    {field.label}
                    {field.required && <span className='text-destructive ml-0.5'>*</span>}
                  </Label>
                  <Input
                    id={`mapping-${field.key}`}
                    placeholder={field.placeholder}
                    value={columnMapping[field.key] || ''}
                    onChange={(e) => handleMappingChange(field.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)} disabled={importMut.isPending}>
            Huỷ
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={importMut.isPending}
            disabled={!file || !provider.trim()}
          >
            <Icons.upload className='mr-2 h-4 w-4' />
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
