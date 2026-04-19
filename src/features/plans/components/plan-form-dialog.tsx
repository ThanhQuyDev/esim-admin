'use client';

import { useState } from 'react';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useMutation } from '@tanstack/react-query';
import { createPlanMutation, updatePlanMutation } from '../api/mutations';
import type { Plan, CreatePlanPayload, UpdatePlanPayload } from '../api/types';
import { toast } from 'sonner';
import * as z from 'zod';
import {
  createPlanSchema,
  updatePlanSchema,
  type CreatePlanFormValues,
  type UpdatePlanFormValues
} from '../schemas/plan';
import { FormDialog } from '@/components/ui/form-dialog';

const PLAN_TYPE_OPTIONS = [
  { value: 'daily-unlimited', label: 'Daily Unlimited' },
  { value: 'fixed-data', label: 'Fixed Data' },
  { value: 'unlimited', label: 'Unlimited' }
];

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' }
];

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
      dataGb: '',
      sms: '',
      call: '',
      costPrice: '',
      price: '',
      retailPrice: '',
      currency: 'USD',
      type: '',
      topUp: false,
      isActive: true
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
        ...(value.dataGb && { dataGb: value.dataGb }),
        ...(value.sms && { sms: Number(value.sms) }),
        ...(value.call && { call: Number(value.call) }),
        ...(value.costPrice && { costPrice: value.costPrice }),
        ...(value.price && { price: value.price }),
        ...(value.retailPrice && { retailPrice: value.retailPrice }),
        ...(value.currency && { currency: value.currency }),
        ...(value.type && { type: value.type }),
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
            <FormTextField name='dataGb' label='Dữ liệu (GB)' placeholder='0.00' />
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
      dataGb: plan.dataGb ?? '',
      sms: plan.sms != null ? String(plan.sms) : '',
      call: plan.call != null ? String(plan.call) : '',
      costPrice: plan.costPrice ?? '',
      price: plan.price ?? '',
      retailPrice: plan.retailPrice ?? '',
      currency: plan.currency ?? 'USD',
      type: plan.type ?? '',
      topUp: plan.topUp,
      isActive: plan.isActive
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
        dataGb: value.dataGb || undefined,
        sms: value.sms ? Number(value.sms) : undefined,
        call: value.call ? Number(value.call) : undefined,
        costPrice: value.costPrice || undefined,
        price: value.price || undefined,
        retailPrice: value.retailPrice || undefined,
        currency: value.currency || undefined,
        type: value.type || undefined,
        topUp: value.topUp,
        isActive: value.isActive
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
            <FormTextField name='dataGb' label='Dữ liệu (GB)' placeholder='0.00' />
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
