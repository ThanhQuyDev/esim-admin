'use client';

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { MANUAL_ORDER_TEMPLATE_URL, previewManualOrderFile } from '../api/service';
import type { ManualOrderFilePreview } from '../api/types';
import { emptyManualOrderLine, type ManualOrderLine } from './manual-order-lines';

/** One manual order takes at most 20 plans (SubmitManualOrderDto). */
const MAX_LINES = 20;

/**
 * "Nhập từ file" for "Đặt đơn hộ khách" (doitac-1410 #084): the plans of a
 * spreadsheet filled into the rows below, instead of picking them one by one.
 * Nothing is ordered until the admin presses "Tạo đơn" as before. A file with
 * any bad row fills nothing — the list of errors says what to fix.
 */
export function ManualOrderFileImport({
  lines,
  onChange
}: {
  lines: ManualOrderLine[];
  onChange: (lines: ManualOrderLine[]) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<ManualOrderFilePreview['lines']>([]);

  const read = useMutation({
    mutationFn: previewManualOrderFile,
    onSuccess: (preview) => {
      const bad = preview.lines.filter((l) => l.error);
      setErrors(bad);
      if (bad.length) {
        toast.error(`File có ${bad.length} dòng lỗi, chưa thêm gói nào.`);
        return;
      }
      // Rows already filled in stay; untouched empty rows are replaced.
      const kept = lines.filter((l) => l.plan);
      const imported = preview.lines.map((l) => ({
        ...emptyManualOrderLine(),
        planCode: l.plan!.slug,
        plan: {
          id: l.plan!.id,
          slug: l.plan!.slug,
          packageCode: l.plan!.packageCode,
          label: l.plan!.label
        },
        quantity: String(l.quantity)
      }));
      if (kept.length + imported.length > MAX_LINES) {
        toast.error(
          `Mỗi đơn tối đa ${MAX_LINES} gói: đơn đang có ${kept.length}, file thêm ${imported.length}.`
        );
        return;
      }
      onChange([...kept, ...imported]);
      const esims = imported.reduce((sum, l) => sum + Number(l.quantity), 0);
      toast.success(`Đã thêm ${imported.length} gói (${esims} eSIM) từ file.`);
    },
    onError: (e: Error) => {
      setErrors([]);
      toast.error(e.message);
    }
  });

  return (
    <div className='space-y-3 rounded-lg border border-dashed p-3' data-testid='manual-order-file'>
      <div className='flex flex-wrap items-center gap-2'>
        <span className='mr-auto text-sm font-medium'>Đặt nhiều gói bằng file</span>
        <Button type='button' variant='outline' size='sm' asChild>
          <a href={MANUAL_ORDER_TEMPLATE_URL} data-testid='manual-order-template'>
            <Icons.download className='mr-2 h-4 w-4' />
            Tải file mẫu
          </a>
        </Button>
        <Button
          type='button'
          size='sm'
          variant='secondary'
          isLoading={read.isPending}
          onClick={() => input.current?.click()}
        >
          <Icons.upload className='mr-2 h-4 w-4' />
          Nhập từ file
        </Button>
        <input
          ref={input}
          type='file'
          accept='.xlsx,.csv'
          className='hidden'
          data-testid='manual-order-file-input'
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) read.mutate(file);
          }}
        />
      </div>
      <p className='text-muted-foreground text-xs'>
        File .xlsx hoặc .csv, cột <strong>Mã gói cước</strong> (slug) và <strong>Số lượng</strong>,
        tối đa {MAX_LINES} dòng. Gói trong file được điền vào danh sách bên dưới để kiểm tra trước
        khi bấm Tạo đơn.
      </p>
      {errors.length > 0 && (
        <Alert variant='destructive' data-testid='manual-order-file-errors'>
          <Icons.warning className='h-4 w-4' />
          <AlertTitle>Chưa thêm gói nào — sửa các dòng sau rồi nhập lại</AlertTitle>
          <AlertDescription>
            <ul className='list-disc space-y-1 pl-4 text-xs'>
              {errors.map((l) => (
                <li key={l.row}>
                  Dòng {l.row}
                  {l.slug ? ` (${l.slug})` : ''}: {l.error}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
