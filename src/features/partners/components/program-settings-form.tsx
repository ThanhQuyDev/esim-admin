'use client';

/**
 * The programme's rules, editable (#075, #076, #077).
 *
 * These used to be constants in the backend source, so changing the minimum
 * withdrawal was a deploy. They are also not one number each: what a marketing
 * partner may withdraw and what a distribution partner must keep on deposit
 * are separate decisions, so each partner type has its own field.
 */

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Icons } from '@/components/icons';
import { formatVnd } from '@/lib/format';

import { updateProgramSettingsMutation } from '../api/mutations';
import { programSettingsQueryOptions } from '../api/queries';
import type { PartnerProgramSettings } from '../api/types';

type FormState = Record<keyof PartnerProgramSettings, string | boolean>;

const toForm = (s: PartnerProgramSettings): FormState => ({
  payoutMinKolVnd: String(s.payoutMinKolVnd),
  payoutMinDistributionVnd: String(s.payoutMinDistributionVnd),
  depositMinKolVnd: String(s.depositMinKolVnd),
  depositMinDistributionVnd: String(s.depositMinDistributionVnd),
  lowDepositWarningVnd: String(s.lowDepositWarningVnd),
  reconciliationEmailEnabled: s.reconciliationEmailEnabled,
  reconciliationEmailDayOfMonth: String(s.reconciliationEmailDayOfMonth)
});

function MoneyField({
  id,
  label,
  hint,
  value,
  onChange
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className='space-y-1.5'>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type='number'
        min='0'
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className='text-muted-foreground text-xs'>
        {Number(value) > 0 ? formatVnd(Number(value)) : 'Không giới hạn'}
        {hint ? ` · ${hint}` : ''}
      </p>
    </div>
  );
}

export function ProgramSettingsForm() {
  const { data } = useQuery(programSettingsQueryOptions());
  const [form, setForm] = useState<FormState | null>(null);
  const queryClient = useQueryClient();

  // Seed the form once the settings arrive, and again if somebody else edits
  // them — but never while the admin is mid-edit of their own copy.
  useEffect(() => {
    if (data && form === null) setForm(toForm(data));
  }, [data, form]);

  const save = useMutation({
    ...updateProgramSettingsMutation,
    onSuccess: () => {
      toast.success('Đã lưu cấu hình chương trình.');
      queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message || 'Lưu cấu hình thất bại')
  });

  if (!form) {
    return (
      <div className='flex justify-center py-12'>
        <Icons.spinner className='h-6 w-6 animate-spin' />
      </div>
    );
  }

  const set = (key: keyof FormState) => (value: string | boolean) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));
  const num = (key: keyof FormState) => Number(form[key]) || 0;

  return (
    <div className='space-y-6'>
      <div className='rounded-lg border p-4'>
        <p className='text-sm font-medium'>Ngưỡng rút tiền hoa hồng tối thiểu</p>
        <p className='text-muted-foreground mt-1 mb-3 text-xs'>
          Đối tác không tạo được yêu cầu rút dưới mức này. Backend kiểm tra lại khi nhận yêu cầu nên
          số ở đây luôn là quy tắc đang chạy.
        </p>
        <div className='grid gap-4 sm:grid-cols-2'>
          <MoneyField
            id='payoutMinKolVnd'
            label='Đối tác tiếp thị'
            value={String(form.payoutMinKolVnd)}
            onChange={set('payoutMinKolVnd')}
          />
          <MoneyField
            id='payoutMinDistributionVnd'
            label='Đối tác phân phối'
            value={String(form.payoutMinDistributionVnd)}
            onChange={set('payoutMinDistributionVnd')}
          />
        </div>
      </div>

      <div className='rounded-lg border p-4'>
        <p className='text-sm font-medium'>Ngưỡng nạp ký quỹ tối thiểu</p>
        <p className='text-muted-foreground mt-1 mb-3 text-xs'>
          Áp dụng khi đối tác chưa được gán mức riêng trong trang chi tiết đối tác — mức riêng của
          từng đối tác luôn được ưu tiên.
        </p>
        <div className='grid gap-4 sm:grid-cols-2'>
          <MoneyField
            id='depositMinKolVnd'
            label='Đối tác tiếp thị'
            value={String(form.depositMinKolVnd)}
            onChange={set('depositMinKolVnd')}
          />
          <MoneyField
            id='depositMinDistributionVnd'
            label='Đối tác phân phối'
            value={String(form.depositMinDistributionVnd)}
            onChange={set('depositMinDistributionVnd')}
          />
        </div>
      </div>

      <div className='rounded-lg border p-4'>
        <p className='text-sm font-medium'>Cảnh báo số dư ký quỹ thấp</p>
        <p className='text-muted-foreground mt-1 mb-3 text-xs'>
          Khi số dư ký quỹ của đối tác phân phối xuống dưới mức này, trang đối tác sẽ nhắc nạp thêm.
          Đây chỉ là nhắc nhở — hệ thống không chặn đối tác đặt hàng.
        </p>
        <div className='sm:max-w-[320px]'>
          <MoneyField
            id='lowDepositWarningVnd'
            label='Mốc nhắc nạp thêm'
            value={String(form.lowDepositWarningVnd)}
            onChange={set('lowDepositWarningVnd')}
          />
        </div>
      </div>

      <div className='rounded-lg border p-4'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium'>Tự động gửi đối soát hàng tháng</p>
            <p className='text-muted-foreground mt-1 text-xs'>
              Hệ thống gửi email bảng đối soát của tháng trước cho tất cả đối tác có phát sinh hoa
              hồng.
            </p>
          </div>
          <Switch
            id='reconciliationEmailEnabled'
            checked={Boolean(form.reconciliationEmailEnabled)}
            onCheckedChange={set('reconciliationEmailEnabled')}
          />
        </div>

        {form.reconciliationEmailEnabled && (
          <div className='mt-4 space-y-1.5 sm:max-w-[320px]'>
            <Label htmlFor='reconciliationEmailDayOfMonth'>Ngày gửi hằng tháng</Label>
            <Input
              id='reconciliationEmailDayOfMonth'
              type='number'
              min='1'
              max='28'
              value={String(form.reconciliationEmailDayOfMonth)}
              onChange={(e) => set('reconciliationEmailDayOfMonth')(e.target.value)}
            />
            <p className='text-muted-foreground text-xs'>
              Ngày {num('reconciliationEmailDayOfMonth') || 5} của tháng N+1 sẽ gửi đối soát tháng
              N. Tối đa ngày 28 để tháng 2 vẫn gửi được.
            </p>
          </div>
        )}
      </div>

      <div className='flex justify-end gap-2'>
        <Button variant='outline' onClick={() => data && setForm(toForm(data))}>
          Hoàn tác
        </Button>
        <Button
          disabled={save.isPending}
          onClick={() =>
            save.mutate({
              payoutMinKolVnd: num('payoutMinKolVnd'),
              payoutMinDistributionVnd: num('payoutMinDistributionVnd'),
              depositMinKolVnd: num('depositMinKolVnd'),
              depositMinDistributionVnd: num('depositMinDistributionVnd'),
              lowDepositWarningVnd: num('lowDepositWarningVnd'),
              reconciliationEmailEnabled: Boolean(form.reconciliationEmailEnabled),
              reconciliationEmailDayOfMonth: num('reconciliationEmailDayOfMonth') || 5
            })
          }
        >
          Lưu cấu hình
        </Button>
      </div>
    </div>
  );
}
