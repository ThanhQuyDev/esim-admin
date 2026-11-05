'use client';

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { cn } from '@/lib/utils';
import { importEsimAccessFileMutation } from '../api/mutations';
import type { ImportEsimAccessResponse } from '../api/types';

const ACTIVE_TYPE: Record<number, string> = {
  1: 'Khi cài đặt eSIM',
  2: 'Khi kết nối mạng lần đầu',
  3: 'Ngay khi mua hàng'
};

/**
 * vande-0411 #027: the esimaccess package list fills in each plan's APN, which
 * the supplier's API only gives after an order, so the TikTok & AI filter can
 * judge esimaccess by APN like every other supplier.
 */
export function ImportEsimAccessDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportEsimAccessResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const importMut = useMutation({
    ...importEsimAccessFileMutation,
    onSuccess: (data) => {
      toast.success(`Đã cập nhật APN cho ${data.updated.toLocaleString('vi-VN')} gói esimaccess`);
      setResult(data);
    },
    onError: (error) => toast.error(error.message || 'Nhập file esimaccess thất bại')
  });

  const reset = () => {
    setFile(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (importMut.isPending) return;
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant='outline' size='sm' data-testid='esimaccess-import-open'>
          <Icons.upload className='mr-2 h-4 w-4' />
          Import file esimaccess
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Import — File esimaccess</DialogTitle>
          <DialogDescription>
            File danh sách gói của esimaccess (.csv hoặc .xlsx). Chỉ bổ sung APN (cột APN) và thời
            điểm bắt đầu tính gói (cột Billing starts) cho gói đã có; không tạo gói mới, không đổi
            giá.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div
            className={cn(
              'border-input hover:border-ring flex cursor-pointer items-center gap-3 rounded-md border border-dashed p-3 transition-colors',
              file && 'border-primary bg-primary/5'
            )}
            onClick={() => inputRef.current?.click()}
          >
            <Icons.fileTypeXls className='text-muted-foreground h-8 w-8 shrink-0' />
            <p className='min-w-0 flex-1 truncate text-sm'>
              {file ? file.name : 'Nhấn để chọn file .csv hoặc .xlsx'}
            </p>
            <input
              ref={inputRef}
              type='file'
              accept='.csv,.xlsx'
              className='hidden'
              data-testid='esimaccess-import-file'
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        ) : (
          <ImportSummary result={result} />
        )}

        <DialogFooter>
          {result ? (
            <Button onClick={() => setOpen(false)}>Đóng</Button>
          ) : (
            <>
              <Button
                variant='outline'
                onClick={() => setOpen(false)}
                disabled={importMut.isPending}
              >
                Huỷ
              </Button>
              <Button
                onClick={() => file && importMut.mutate(file)}
                isLoading={importMut.isPending}
                disabled={!file}
                data-testid='esimaccess-import-submit'
              >
                Import
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportSummary({ result }: { result: ImportEsimAccessResponse }) {
  const n = (value: number) => value.toLocaleString('vi-VN');
  return (
    <div className='grid gap-4 text-sm' data-testid='esimaccess-import-result'>
      <div className='grid grid-cols-3 gap-2 text-center'>
        <Stat label='Dòng trong file' value={n(result.total)} />
        <Stat label='Gói đã cập nhật' value={n(result.updated)} tone='success' />
        <Stat label='Không có trong CMS' value={n(result.notInCatalog.length)} tone='warning' />
      </div>

      {result.unknownApns.length > 0 && (
        <Section
          title={`APN chưa có trong bảng APN (${result.unknownApns.length})`}
          note='Gói dùng các APN này tạm thời vẫn xét TikTok & AI theo IP ra. Hãy thêm các APN này vào trang Quản lý APN để lọc theo APN.'
        >
          {result.unknownApns.map((row) => (
            <Badge key={row.apn} variant='outline'>
              {row.apn} · {n(row.plans)} gói
            </Badge>
          ))}
        </Section>
      )}

      {result.notInCatalog.length > 0 && (
        <Section
          title={`Mã gói không có trong CMS (${result.notInCatalog.length})`}
          note='Bỏ qua, vì file chỉ bổ sung thông tin cho gói đã đồng bộ.'
        >
          {result.notInCatalog.slice(0, 50).map((code) => (
            <Badge key={code} variant='outline'>
              {code}
            </Badge>
          ))}
        </Section>
      )}

      {result.noApn.length > 0 && (
        <Section
          title={`Gói không có APN trong file (${result.noApn.length})`}
          note='Giữ nguyên APN đang có.'
        >
          {result.noApn.slice(0, 50).map((code) => (
            <Badge key={code} variant='outline'>
              {code}
            </Badge>
          ))}
        </Section>
      )}

      {result.billingMismatches.length > 0 ? (
        <Section
          title={`Billing starts khác API (${result.billingMismatches.length})`}
          note='Hệ thống ưu tiên thông tin lấy qua API.'
        >
          {result.billingMismatches.slice(0, 50).map((row) => (
            <Badge key={row.code} variant='outline'>
              {row.code}: file “{row.file}”, API “{ACTIVE_TYPE[row.api] ?? row.api}”
            </Badge>
          ))}
        </Section>
      ) : (
        <p className='text-muted-foreground'>
          Cột Billing starts khớp với thông tin lấy qua API ở tất cả gói đã cập nhật.
        </p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone?: 'success' | 'warning';
}) {
  return (
    <div
      className={cn(
        'bg-muted rounded-lg p-2',
        tone === 'success' && 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
        tone === 'warning' && 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
      )}
    >
      <p className='text-lg font-bold'>{value}</p>
      <p className='text-xs opacity-80'>{label}</p>
    </div>
  );
}

function Section({
  title,
  note,
  children
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <div className='grid gap-1.5'>
      <p className='font-medium'>{title}</p>
      <p className='text-muted-foreground text-xs'>{note}</p>
      <div className='flex max-h-32 flex-wrap gap-1.5 overflow-y-auto'>{children}</div>
    </div>
  );
}
