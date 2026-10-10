'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { createApnSupportMutation, updateApnSupportMutation } from '../api/mutations';
import type { ApnAppField, ApnSupport, SaveApnSupportPayload } from '../api/types';

const APPS: { label: string; ios: ApnAppField; android: ApnAppField }[] = [
  { label: 'TikTok', ios: 'tiktokIos', android: 'tiktokAndroid' },
  { label: 'ChatGPT', ios: 'chatGptIos', android: 'chatGptAndroid' },
  { label: 'Gemini', ios: 'geminiIos', android: 'geminiAndroid' },
  { label: 'Claude', ios: 'claudeIos', android: 'claudeAndroid' }
];

function initialValues(row?: ApnSupport | null): SaveApnSupportPayload {
  const values: SaveApnSupportPayload = { apnLabel: row?.apnLabel ?? '', note: row?.note ?? '' };
  for (const app of APPS) {
    values[app.ios] = row?.[app.ios] ?? false;
    values[app.android] = row?.[app.android] ?? false;
  }
  return values;
}

/**
 * Add or edit one APN row (#044, test round 4) — for changing a few APNs without
 * building a new sheet to import. Saving a row that was auto-added from plans
 * marks it as filled in.
 */
export function ApnFormDialog({
  open,
  onOpenChange,
  row
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The row to edit; absent to add a new one. */
  row?: ApnSupport | null;
}) {
  const [values, setValues] = useState<SaveApnSupportPayload>(() => initialValues(row));

  useEffect(() => {
    if (open) setValues(initialValues(row));
  }, [open, row]);

  const create = useMutation({
    ...createApnSupportMutation,
    onSuccess: () => {
      toast.success('Đã thêm APN');
      onOpenChange(false);
    },
    onError: (error) => toast.error(error.message || 'Không thêm được APN')
  });
  const update = useMutation({
    ...updateApnSupportMutation,
    onSuccess: () => {
      toast.success('Đã lưu APN');
      onOpenChange(false);
    },
    onError: (error) => toast.error(error.message || 'Không lưu được APN')
  });
  const saving = create.isPending || update.isPending;

  const submit = () => {
    if (!values.apnLabel.trim()) {
      toast.error('Nhập tên APN');
      return;
    }
    const payload = { ...values, note: values.note?.trim() || null };
    if (row) update.mutate({ id: row.id, data: payload });
    else create.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{row ? `Sửa APN ${row.apnLabel}` : 'Thêm APN'}</DialogTitle>
          <DialogDescription>
            Bật nền tảng mà APN này dùng được. Lần nạp file Excel sau sẽ thay toàn bộ bảng.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-1.5'>
            <Label htmlFor='apnLabel'>APN</Label>
            <Input
              id='apnLabel'
              value={values.apnLabel}
              placeholder='cmhk'
              onChange={(e) => setValues((v) => ({ ...v, apnLabel: e.target.value }))}
            />
          </div>

          <div className='rounded-md border'>
            <div className='text-muted-foreground grid grid-cols-3 border-b px-3 py-2 text-xs font-medium'>
              <span>Nền tảng</span>
              <span className='text-center'>iPhone</span>
              <span className='text-center'>Android</span>
            </div>
            {APPS.map((app) => (
              <div key={app.label} className='grid grid-cols-3 items-center px-3 py-2'>
                <span className='text-sm'>{app.label}</span>
                {[app.ios, app.android].map((field) => (
                  <div key={field} className='flex justify-center'>
                    <Switch
                      checked={!!values[field]}
                      onCheckedChange={(checked) => setValues((v) => ({ ...v, [field]: checked }))}
                      aria-label={`${app.label} ${field.endsWith('Ios') ? 'iPhone' : 'Android'}`}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='apnNote'>Ghi chú</Label>
            <Textarea
              id='apnNote'
              rows={2}
              value={values.note ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, note: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={saving}>
            Hủy
          </Button>
          <Button onClick={submit} isLoading={saving}>
            <Icons.check className='mr-2 h-4 w-4' />
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
