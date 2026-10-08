'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { format, parse } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { FormDialog } from '@/components/ui/form-dialog';
import { Icons } from '@/components/icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
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

/** The picked day is kept as `yyyy-MM-dd`; the box shows it as DD-MM-YYYY. */
const VALUE_FORMAT = 'yyyy-MM-dd';

function toDate(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parse(value, VALUE_FORMAT, new Date());
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

/**
 * The picked day at local noon, so no time zone can roll it onto the day
 * before or after. Empty means "now" on the server.
 */
function parseOccurredAt(value: string): string | undefined {
  const day = toDate(value);
  if (!day) return undefined;
  day.setHours(12, 0, 0, 0);
  return day.toISOString();
}

/**
 * Calendar instead of a typed `YYYY-MM-DD` box (v3 #005): easier to pick and
 * the format cannot come out wrong.
 */
function OccurredAtPicker({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = toDate(value);

  return (
    <div className='space-y-2'>
      <Label>Thời điểm</Label>
      <div className='flex gap-2'>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type='button'
              variant='outline'
              data-testid='deposit-occurred-at'
              className={cn(
                'w-full justify-start text-left font-normal',
                !selected && 'text-muted-foreground'
              )}
            >
              <Icons.calendar className='mr-2 h-4 w-4' />
              {selected ? format(selected, 'dd-MM-yyyy') : 'Bỏ trống = hôm nay (DD-MM-YYYY)'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-auto p-0' align='start'>
            <Calendar
              mode='single'
              selected={selected}
              defaultMonth={selected}
              onSelect={(day) => {
                onChange(day ? format(day, VALUE_FORMAT) : '');
                setOpen(false);
              }}
              locale={vi}
              disabled={{ after: new Date() }}
            />
          </PopoverContent>
        </Popover>
        {selected && (
          <Button
            type='button'
            variant='ghost'
            size='icon'
            aria-label='Xóa ngày'
            onClick={() => onChange('')}
          >
            <Icons.close className='h-4 w-4' />
          </Button>
        )}
      </div>
    </div>
  );
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

          <form.AppField name='occurredAt'>
            {(field) => (
              <OccurredAtPicker
                value={field.state.value}
                onChange={(next) => field.handleChange(next)}
              />
            )}
          </form.AppField>
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
