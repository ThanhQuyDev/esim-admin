'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { FormDialog } from '@/components/ui/form-dialog';
import { Icons } from '@/components/icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { PROVIDER_LABELS, OVERVIEW_PROVIDERS } from '@/features/overview/api/constants';
import { createProviderDepositEntryMutation } from '../api/mutations';
import { ENTRY_TYPE_OPTIONS } from '../api/types';
import type { CreateProviderDepositEntryPayload } from '../api/types';
import {
  parseVndAmount,
  providerDepositEntrySchema,
  type ProviderDepositEntryFormValues
} from '../schemas/provider-deposit';

/**
 * Parse the hand-typed date. Anything unparseable is dropped rather than sent,
 * so a typo silently falls back to "now" on the server instead of storing a
 * bogus timestamp.
 */
function parseOccurredAt(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

interface ProviderDepositFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Preselected supplier when opened from a table row. */
  provider?: string;
}

export function ProviderDepositFormDialog({
  open,
  onOpenChange,
  provider
}: ProviderDepositFormDialogProps) {
  const mutation = useMutation({
    ...createProviderDepositEntryMutation,
    onSuccess: () => {
      toast.success('Đã ghi nhận. Số dư ký quỹ được tính lại ngay.');
      onOpenChange(false);
      form.reset();
    },
    onError: (e) => toast.error(e.message || 'Không lưu được')
  });

  const form = useAppForm({
    defaultValues: {
      provider: provider ?? '',
      type: 'deposit',
      amountVnd: '',
      reportedBalanceVnd: '',
      occurredAt: '',
      note: ''
    } as ProviderDepositEntryFormValues,
    validators: { onSubmit: providerDepositEntrySchema },
    onSubmit: async ({ value }) => {
      const payload: CreateProviderDepositEntryPayload = {
        provider: value.provider,
        type: value.type,
        // A reconciliation only records what the supplier said, so it must not
        // move money even if the amount box was left filled in.
        amountVnd: value.type === 'reconciliation' ? 0 : (parseVndAmount(value.amountVnd) ?? 0),
        reportedBalanceVnd: parseVndAmount(value.reportedBalanceVnd),
        note: value.note.trim() || null,
        ...(parseOccurredAt(value.occurredAt)
          ? { occurredAt: parseOccurredAt(value.occurredAt) }
          : {})
      };
      await mutation.mutateAsync(payload);
    }
  });

  const { FormTextField, FormSelectField, FormTextareaField } =
    useFormFields<ProviderDepositEntryFormValues>();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Ghi nhận ký quỹ'
      description='Nhập tiền đã chuyển cho nhà cung cấp, hoặc số dư nhà cung cấp đang báo.'
      formId='provider-deposit-form-dialog'
      isLoading={mutation.isPending}
      submitLabel='Lưu'
      metaInfo={
        <>
          <Icons.wallet className='h-4 w-4' />
          <span>Ký quỹ nhà cung cấp</span>
        </>
      }
    >
      <form.AppForm>
        <form.Form id='provider-deposit-form-dialog' className='space-y-6'>
          <Alert>
            <Icons.info className='h-4 w-4' />
            <AlertDescription>
              Số đã dùng KHÔNG nhập tay — hệ thống tự cộng từ các đơn đã hoàn tất của nhà cung cấp
              đó. Ở đây chỉ nhập tiền nạp vào và số dư nhà cung cấp báo, để so xem có lệch không.
            </AlertDescription>
          </Alert>

          <div className='grid grid-cols-2 gap-4'>
            <FormSelectField
              name='provider'
              label='Nhà cung cấp'
              placeholder='Chọn nhà cung cấp'
              options={OVERVIEW_PROVIDERS.map((value) => ({
                value,
                label: PROVIDER_LABELS[value] ?? value
              }))}
            />
            <FormSelectField
              name='type'
              label='Loại ghi nhận'
              options={ENTRY_TYPE_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label
              }))}
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <FormTextField
              name='amountVnd'
              label='Số tiền (VNĐ)'
              placeholder='VD: 78,330,000'
              autoComplete='off'
            />
            <FormTextField
              name='reportedBalanceVnd'
              label='Số dư nhà cung cấp báo (VNĐ)'
              placeholder='Bỏ trống nếu chưa kiểm tra'
              inputMode='numeric'
              autoComplete='off'
            />
          </div>

          <p className='text-muted-foreground text-xs'>
            {ENTRY_TYPE_OPTIONS.map((o) => `${o.label}: ${o.hint}`).join(' · ')}
          </p>

          <FormTextField
            name='occurredAt'
            label='Thời điểm (YYYY-MM-DD)'
            placeholder='Bỏ trống = thời điểm hiện tại'
          />
          <FormTextareaField
            name='note'
            label='Ghi chú'
            placeholder='VD: Chuyển khoản VietinBank 12/09'
          />
        </form.Form>
      </form.AppForm>
    </FormDialog>
  );
}

/** Header button on the deposits page. */
export function ProviderDepositFormDialogTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size='sm' onClick={() => setOpen(true)}>
        <Icons.add className='mr-2 h-4 w-4' />
        Ghi nhận ký quỹ
      </Button>
      <ProviderDepositFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
