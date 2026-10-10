'use client';

import { useState } from 'react';
import { useAppForm, useFormContext, useFormFields } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FieldLabel } from '@/components/ui/field';
import { Icons } from '@/components/icons';
import { useMutation } from '@tanstack/react-query';
import { createPlanMutation, updatePlanMutation } from '../api/mutations';
import type { Plan, CreatePlanPayload, UpdatePlanPayload } from '../api/types';
import { toast } from 'sonner';
import * as z from 'zod';
import {
  createPlanSchema,
  updatePlanSchema,
  DAILY_RESET_OPTIONS,
  PLAN_TAG_OPTIONS,
  type CreatePlanFormValues,
  type DailyResetPolicy,
  type PlanTag,
  type UpdatePlanFormValues
} from '../schemas/plan';
import { FormDialog } from '@/components/ui/form-dialog';
import { cn } from '@/lib/utils';

const PLAN_TYPE_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'unlimited', label: 'Unlimited' },
  { value: 'fixed', label: 'Fixed' },
  { value: 'unlimited-reduce', label: 'Unlimited Reduce' }
];

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' }
];

function TagsPicker({
  value,
  onChange
}: {
  value: PlanTag[];
  onChange: (next: PlanTag[]) => void;
}) {
  const toggle = (tag: PlanTag) => {
    onChange(value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag]);
  };
  return (
    <div className='space-y-2'>
      <FieldLabel>Tags</FieldLabel>
      <div className='flex flex-wrap gap-2'>
        {PLAN_TAG_OPTIONS.map((opt) => {
          const selected = value.includes(opt.value);
          return (
            <Badge
              key={opt.value}
              variant={selected ? 'default' : 'outline'}
              onClick={() => toggle(opt.value)}
              className={cn(
                'cursor-pointer select-none transition-colors',
                !selected && 'hover:bg-muted'
              )}
            >
              {opt.label}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The UTC offset belongs to a calendar-day reset and nothing else. Sending it
 * for a rolling 24-hour cycle would store a timezone the cycle does not use —
 * and the field is hidden in that case, so whatever is left in form state after
 * switching the policy is stale rather than chosen.
 */
function dailyResetOffsetValue(value: CreatePlanFormValues): number | null {
  if (value.dailyResetPolicy !== 'calendar_day') return null;
  // 0 (UTC+0) is a real offset — only an empty field means "not stated".
  const offset = value.dailyResetUtcOffset;
  if (offset === undefined || offset === null || offset === '') return null;
  return Number(offset);
}

/**
 * APN, TikTok/ChatGPT and "Giờ làm mới" (#063).
 *
 * All three were already stored and filterable in the list (#010, #041) but the
 * detail form never showed them, so an admin could see a plan was filtered out
 * as TikTok-incapable and had no way to correct it. One component, rendered by
 * both dialogs — `UpdatePlanFormValues` is `CreatePlanFormValues`, and the fields
 * resolve the form from context, so nothing has to be threaded through.
 */
function ConnectivityFields() {
  const form = useFormContext();
  const { FormTextField, FormSelectField, FormSwitchField } = useFormFields<CreatePlanFormValues>();

  return (
    <div className='space-y-5 rounded-lg border p-4'>
      <div className='text-sm font-medium'>Kết nối & giới hạn</div>

      <div className='grid grid-cols-2 gap-4'>
        <FormTextField
          name='apn'
          label='APN'
          placeholder='internet'
          description='Nhà cung cấp trả về qua API; esimaccess không cung cấp APN.'
        />
        <FormSwitchField
          name='isNonHkIp'
          label='TikTok & ChatGPT'
          description='IP ra là IP nội địa, không đi qua Hồng Kông.'
        />
      </div>

      <div className='grid grid-cols-2 gap-4'>
        {/* Where traffic exits (#043, test round 4). esimaccess reports it; any
            exit but HK means TikTok & ChatGPT work, and the sync sets the switch
            above from it. */}
        <FormTextField
          name='ipExport'
          label='IP ra (Exit IP)'
          placeholder='SG, FR/NL/UK, HK…'
          description='Nhà cung cấp trả về qua API. Khác HK ⇒ dùng được TikTok & ChatGPT.'
        />
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <FormSelectField
          name='dailyResetPolicy'
          label='Giờ làm mới mỗi ngày'
          options={DAILY_RESET_OPTIONS}
          placeholder='Nhà cung cấp chưa nêu'
        />
        {/* The offset only means anything for a calendar day — a rolling cycle
            starts whenever the customer installs, in no particular timezone. */}
        {/* The form from context is untyped by design (any form can render these
            fields), so the values are narrowed here rather than at the call. */}
        <form.Subscribe
          selector={(state) => (state.values as unknown as CreatePlanFormValues).dailyResetPolicy}
        >
          {(policy) =>
            policy === 'calendar_day' ? (
              <FormTextField
                name='dailyResetUtcOffset'
                label='Múi giờ (UTC+)'
                placeholder='8'
                type='number'
                description='Viettel và eSIM nội địa: 7. Billion/MicroEsim: 8.'
              />
            ) : null
          }
        </form.Subscribe>
      </div>
    </div>
  );
}

interface PlanFormDialogProps {
  plan?: Plan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlanFormDialog({ plan, open, onOpenChange }: PlanFormDialogProps) {
  if (plan) {
    return <EditDialog key={plan.id} plan={plan} open={open} onOpenChange={onOpenChange} />;
  }
  return <CreateDialog open={open} onOpenChange={onOpenChange} />;
}

function CreateDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createMut = useMutation({
    ...createPlanMutation,
    onSuccess: () => {
      toast.success('Tạo gói thành công');
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => toast.error(error.message || 'Tạo gói thất bại')
  });

  const form = useAppForm({
    defaultValues: {
      name: '',
      provider: '',
      providerPlanId: '',
      slug: '',
      countryCode: '',
      destinationId: '',
      regionId: '',
      durationDays: '',
      dataMb: '',
      sms: '',
      call: '',
      costPrice: '',
      price: '',
      retailPrice: '',
      currency: 'USD',
      type: '',
      topUp: false,
      isActive: true,
      tags: [] as PlanTag[],
      apn: '',
      isNonHkIp: false,
      ipExport: '',
      dailyResetPolicy: '',
      dailyResetUtcOffset: ''
    } as CreatePlanFormValues,
    validators: {
      onSubmit: createPlanSchema
    },
    onSubmit: async ({ value }) => {
      const payload: CreatePlanPayload = {
        name: value.name,
        ...(value.provider && { provider: value.provider }),
        ...(value.providerPlanId && { providerPlanId: value.providerPlanId }),
        ...(value.slug && { slug: value.slug }),
        ...(value.countryCode && { countryCode: value.countryCode }),
        ...(value.destinationId && { destinationId: Number(value.destinationId) }),
        ...(value.regionId && { regionId: Number(value.regionId) }),
        ...(value.durationDays && { durationDays: Number(value.durationDays) }),
        ...(value.dataMb && { dataMb: Number(value.dataMb) }),
        ...(value.sms && { sms: Number(value.sms) }),
        ...(value.call && { call: Number(value.call) }),
        ...(value.costPrice && { costPrice: value.costPrice }),
        ...(value.price && { price: value.price }),
        ...(value.retailPrice && { retailPrice: value.retailPrice }),
        ...(value.currency && { currency: value.currency }),
        ...(value.type && { type: value.type }),
        ...(value.tags && value.tags.length > 0 && { tags: value.tags }),
        ...(value.apn && { apn: value.apn }),
        // Leaving the policy blank sends nothing, so the backend fills in what
        // the supplier is known to do rather than storing "unknown" (#063).
        ...(value.dailyResetPolicy && {
          dailyResetPolicy: value.dailyResetPolicy as DailyResetPolicy
        }),
        ...(dailyResetOffsetValue(value) != null && {
          dailyResetUtcOffset: dailyResetOffsetValue(value)
        }),
        isNonHkIp: value.isNonHkIp ?? false,
        ...(value.ipExport?.trim() && { ipExport: value.ipExport.trim() }),
        topUp: value.topUp ?? false,
        isActive: value.isActive ?? true
      };
      await createMut.mutateAsync(payload);
    }
  });

  const { FormTextField, FormSelectField, FormSwitchField } = useFormFields<CreatePlanFormValues>();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Gói eSIM mới'
      description='Điền thông tin để tạo gói mới.'
      formId='plan-form-dialog'
      isLoading={createMut.isPending}
      submitLabel='Tạo mới'
      metaInfo={
        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
          <Icons.dashboard className='h-3.5 w-3.5' />
          <span>Quản lý gói eSIM</span>
        </div>
      }
    >
      <form.AppForm>
        <form.Form id='plan-form-dialog' className='space-y-5'>
          <FormTextField
            name='name'
            label='Tên gói'
            required
            placeholder='Không giới hạn - 3 ngày'
            validators={{
              onBlur: z.string().min(2, 'Tên phải có ít nhất 2 ký tự')
            }}
          />

          <div className='grid grid-cols-2 gap-4'>
            <FormTextField name='provider' label='Nhà cung cấp' placeholder='airalo' />
            <FormTextField
              name='providerPlanId'
              label='Mã gói nhà cung cấp'
              placeholder='plan-id'
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <FormTextField name='countryCode' label='Mã quốc gia' placeholder='US' />
            <FormTextField name='slug' label='Slug' placeholder='goi-slug' />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <FormTextField name='destinationId' label='Mã điểm đến' placeholder='1' />
            <FormTextField name='regionId' label='Mã khu vực' placeholder='1' />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <FormTextField name='durationDays' label='Thời hạn (ngày)' placeholder='3' />
            <FormTextField name='dataMb' label='Dữ liệu (MB)' placeholder='500' />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <FormTextField name='sms' label='SMS' placeholder='Số lượng SMS' />
            <FormTextField name='call' label='Gọi điện (phút)' placeholder='Số phút gọi' />
          </div>

          <div className='grid grid-cols-3 gap-4'>
            <FormTextField name='costPrice' label='Giá gốc' placeholder='6.30' />
            <FormTextField name='price' label='Giá' placeholder='6.30' />
            <FormTextField name='retailPrice' label='Giá bán lẻ' placeholder='11.50' />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <FormSelectField name='currency' label='Tiền tệ' options={CURRENCY_OPTIONS} />
            <FormSelectField
              name='type'
              label='Loại'
              options={PLAN_TYPE_OPTIONS}
              placeholder='Chọn loại'
            />
          </div>

          <form.AppField name='tags'>
            {(field) => (
              <TagsPicker
                value={(field.state.value ?? []) as PlanTag[]}
                onChange={(next) => field.handleChange(next)}
              />
            )}
          </form.AppField>

          <ConnectivityFields />

          <div className='grid grid-cols-2 gap-4'>
            <FormSwitchField name='topUp' label='Top-Up' />
            <FormSwitchField name='isActive' label='Hoạt động' />
          </div>
        </form.Form>
      </form.AppForm>
    </FormDialog>
  );
}

function EditDialog({
  plan,
  open,
  onOpenChange
}: {
  plan: Plan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateMut = useMutation({
    ...updatePlanMutation,
    onSuccess: () => {
      toast.success('Cập nhật gói thành công');
      onOpenChange(false);
    },
    onError: (error) => toast.error(error.message || 'Cập nhật gói thất bại')
  });

  const form = useAppForm({
    defaultValues: {
      name: plan.name,
      provider: plan.provider ?? '',
      providerPlanId: plan.providerPlanId ?? '',
      slug: plan.slug ?? '',
      countryCode: plan.countryCode ?? '',
      destinationId: plan.destinationId ? String(plan.destinationId) : '',
      regionId: plan.regionId ? String(plan.regionId) : '',
      durationDays: String(plan.durationDays ?? ''),
      dataMb: plan.dataMb != null ? String(plan.dataMb) : '',
      sms: plan.sms != null ? String(plan.sms) : '',
      call: plan.call != null ? String(plan.call) : '',
      costPrice: plan.costPrice ?? '',
      price: plan.price ?? '',
      retailPrice: plan.retailPrice ?? '',
      currency: plan.currency ?? 'USD',
      type: plan.type ?? '',
      topUp: plan.topUp,
      isActive: plan.isActive,
      tags: (plan.tags ?? []) as PlanTag[],
      apn: plan.apn ?? '',
      isNonHkIp: plan.isNonHkIp,
      ipExport: plan.ipExport ?? '',
      dailyResetPolicy: plan.dailyResetPolicy ?? '',
      dailyResetUtcOffset: plan.dailyResetUtcOffset != null ? String(plan.dailyResetUtcOffset) : ''
    } as UpdatePlanFormValues,
    validators: {
      onSubmit: updatePlanSchema
    },
    onSubmit: async ({ value }) => {
      const payload: UpdatePlanPayload = {
        name: value.name,
        provider: value.provider || undefined,
        providerPlanId: value.providerPlanId || undefined,
        slug: value.slug || undefined,
        countryCode: value.countryCode || undefined,
        destinationId: value.destinationId ? Number(value.destinationId) : undefined,
        regionId: value.regionId ? Number(value.regionId) : undefined,
        durationDays: value.durationDays ? Number(value.durationDays) : undefined,
        dataMb: value.dataMb ? Number(value.dataMb) : undefined,
        sms: value.sms ? Number(value.sms) : undefined,
        call: value.call ? Number(value.call) : undefined,
        costPrice: value.costPrice || undefined,
        price: value.price || undefined,
        retailPrice: value.retailPrice || undefined,
        currency: value.currency || undefined,
        type: value.type || undefined,
        topUp: value.topUp,
        isActive: value.isActive,
        tags: value.tags ?? [],
        // null rather than undefined: an admin clearing APN or the reset policy
        // means "we do not know", and undefined would silently keep the old value.
        apn: value.apn || null,
        isNonHkIp: value.isNonHkIp ?? false,
        ipExport: value.ipExport?.trim() || null,
        dailyResetPolicy: (value.dailyResetPolicy || null) as DailyResetPolicy | null,
        dailyResetUtcOffset: dailyResetOffsetValue(value)
      };
      await updateMut.mutateAsync({ id: plan.id, values: payload });
    }
  });

  const { FormTextField, FormSelectField, FormSwitchField } = useFormFields<UpdatePlanFormValues>();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Chỉnh sửa gói eSIM'
      description='Cập nhật thông tin gói bên dưới.'
      formId='plan-form-dialog'
      isLoading={updateMut.isPending}
      submitLabel='Cập nhật'
      metaInfo={
        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
          <Icons.dashboard className='h-3.5 w-3.5' />
          <span>ID: {plan.id}</span>
          <button
            type='button'
            onClick={() => {
              navigator.clipboard.writeText(String(plan.id));
            }}
            title='Copy ID'
            className='text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center rounded p-0.5 transition-colors'
            aria-label={`Copy ID: ${plan.id}`}
          >
            <Icons.copy className='size-3.5' />
          </button>
        </div>
      }
    >
      <form.AppForm>
        <form.Form id='plan-form-dialog' className='space-y-5'>
          <FormTextField
            name='name'
            label='Tên gói'
            required
            placeholder='Không giới hạn - 3 ngày'
            validators={{
              onBlur: z.string().min(2, 'Tên phải có ít nhất 2 ký tự')
            }}
          />

          <div className='grid grid-cols-2 gap-4'>
            <FormTextField name='provider' label='Nhà cung cấp' placeholder='airalo' />
            <FormTextField
              name='providerPlanId'
              label='Mã gói nhà cung cấp'
              placeholder='plan-id'
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <FormTextField name='countryCode' label='Mã quốc gia' placeholder='US' />
            <FormTextField name='slug' label='Slug' placeholder='goi-slug' />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <FormTextField name='destinationId' label='Mã điểm đến' placeholder='1' />
            <FormTextField name='regionId' label='Mã khu vực' placeholder='1' />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <FormTextField name='durationDays' label='Thời hạn (ngày)' placeholder='3' />
            <FormTextField name='dataMb' label='Dữ liệu (MB)' placeholder='500' />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <FormTextField name='sms' label='SMS' placeholder='Số lượng SMS' />
            <FormTextField name='call' label='Gọi điện (phút)' placeholder='Số phút gọi' />
          </div>

          <div className='grid grid-cols-3 gap-4'>
            <FormTextField name='costPrice' label='Giá gốc' placeholder='6.30' />
            <FormTextField name='price' label='Giá' placeholder='6.30' />
            <FormTextField name='retailPrice' label='Giá bán lẻ' placeholder='11.50' />
          </div>

          <FormSelectField
            name='type'
            label='Loại'
            options={PLAN_TYPE_OPTIONS}
            placeholder='Chọn loại'
          />

          <form.AppField name='tags'>
            {(field) => (
              <TagsPicker
                value={(field.state.value ?? []) as PlanTag[]}
                onChange={(next) => field.handleChange(next)}
              />
            )}
          </form.AppField>

          <ConnectivityFields />

          <div className='grid grid-cols-2 gap-4'>
            <FormSwitchField name='topUp' label='Top-Up' />
            <FormSwitchField name='isActive' label='Hoạt động' />
          </div>
        </form.Form>
      </form.AppForm>
    </FormDialog>
  );
}

export function PlanFormDialogTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size='sm'>
        <Icons.add className='mr-2 h-4 w-4' /> Thêm gói
      </Button>
      <PlanFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
