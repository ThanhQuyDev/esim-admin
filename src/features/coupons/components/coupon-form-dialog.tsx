'use client';

import React, { useState } from 'react';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { FormDialog } from '@/components/ui/form-dialog';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { useMutation } from '@tanstack/react-query';
import { createCouponMutation, updateCouponMutation } from '../api/mutations';
import type { Coupon, CreateCouponPayload, UpdateCouponPayload } from '../api/types';
import { toast } from 'sonner';
import * as z from 'zod';
import {
  createCouponSchema,
  updateCouponSchema,
  type CreateCouponFormValues,
  type UpdateCouponFormValues
} from '../schemas/coupon';

interface CouponFormDialogProps {
  coupon?: Coupon;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CouponFormDialog({ coupon, open, onOpenChange }: CouponFormDialogProps) {
  const isEdit = !!coupon;

  if (isEdit) {
    return (
      <EditCouponDialog key={coupon.id} coupon={coupon} open={open} onOpenChange={onOpenChange} />
    );
  }

  return <CreateCouponDialog open={open} onOpenChange={onOpenChange} />;
}

export function CouponFormDialogTrigger() {
  return (
    <CouponFormDialogWrapper>
      {({ setOpen }) => (
        <button
          onClick={() => setOpen(true)}
          className='bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow-sm transition-colors'
        >
          <Icons.add className='mr-2 h-4 w-4' />
          Thêm coupon
        </button>
      )}
    </CouponFormDialogWrapper>
  );
}

function CouponFormDialogWrapper({
  children
}: {
  children: (props: { setOpen: (open: boolean) => void }) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {children({ setOpen })}
      <CouponFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

function DateTimeField({
  label,
  value,
  onChange,
  required
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
}) {
  return (
    <div className='space-y-2'>
      <label className='text-sm font-medium'>
        {label}
        {required && ' *'}
      </label>
      <Input type='datetime-local' value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function CreateCouponDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createMutation = useMutation({
    ...createCouponMutation,
    onSuccess: () => {
      toast.success('Tạo coupon thành công');
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => toast.error(error.message || 'Tạo coupon thất bại')
  });

  const form = useAppForm({
    defaultValues: {
      code: '',
      discountPercent: 10,
      maxUsage: 100,
      maxUsagePerUser: 1,
      minOrderAmount: 0,
      expiresAt: '',
      isActive: true
    } as CreateCouponFormValues,
    validators: {
      onSubmit: createCouponSchema
    },
    onSubmit: async ({ value }) => {
      const payload: CreateCouponPayload = {
        code: value.code,
        discountPercent: value.discountPercent,
        maxUsage: value.maxUsage,
        maxUsagePerUser: value.maxUsagePerUser,
        minOrderAmount: value.minOrderAmount,
        expiresAt: new Date(value.expiresAt).toISOString(),
        isActive: value.isActive ?? true
      };

      await createMutation.mutateAsync(payload);
    }
  });

  const { FormTextField, FormSwitchField } = useFormFields<CreateCouponFormValues>();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Coupon mới'
      description='Tạo mã giảm giá mới trong hệ thống'
      formId='coupon-form-dialog'
      isLoading={createMutation.isPending}
      submitLabel='Tạo mới'
      metaInfo={
        <>
          <Icons.billing className='h-4 w-4' />
          <span>Quản lý coupon</span>
        </>
      }
    >
      <form.AppForm>
        <form.Form id='coupon-form-dialog' className='space-y-6'>
          <FormTextField
            name='code'
            label='Mã coupon'
            required
            placeholder='SUMMER10'
            validators={{
              onBlur: z.string().min(2, 'Mã coupon phải có ít nhất 2 ký tự')
            }}
          />

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormTextField
              name='discountPercent'
              label='Giảm giá (%)'
              required
              placeholder='10'
              type='number'
            />
            <FormTextField
              name='minOrderAmount'
              label='Đơn tối thiểu (VNĐ)'
              required
              placeholder='5'
              type='number'
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormTextField
              name='maxUsage'
              label='Lượt dùng tối đa'
              required
              placeholder='100'
              type='number'
            />
            <FormTextField
              name='maxUsagePerUser'
              label='Lượt/người dùng'
              required
              placeholder='1'
              type='number'
            />
          </div>

          <DateTimeField
            label='Ngày hết hạn'
            required
            value={form.getFieldValue('expiresAt') ?? ''}
            onChange={(val) => form.setFieldValue('expiresAt', val)}
          />

          <FormSwitchField name='isActive' label='Hoạt động' />
        </form.Form>
      </form.AppForm>
    </FormDialog>
  );
}

function EditCouponDialog({
  coupon,
  open,
  onOpenChange
}: {
  coupon: Coupon;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateMutation = useMutation({
    ...updateCouponMutation,
    onSuccess: () => {
      toast.success('Cập nhật coupon thành công');
      onOpenChange(false);
    },
    onError: (error) => toast.error(error.message || 'Cập nhật coupon thất bại')
  });

  const expiresAtLocal = coupon.expiresAt
    ? new Date(coupon.expiresAt).toISOString().slice(0, 16)
    : '';

  const form = useAppForm({
    defaultValues: {
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      maxUsage: coupon.maxUsage,
      maxUsagePerUser: coupon.maxUsagePerUser,
      minOrderAmount: coupon.minOrderAmount,
      expiresAt: expiresAtLocal,
      isActive: coupon.isActive
    } as UpdateCouponFormValues,
    validators: {
      onSubmit: updateCouponSchema
    },
    onSubmit: async ({ value }) => {
      const payload: UpdateCouponPayload = {
        code: value.code,
        discountPercent: value.discountPercent,
        maxUsage: value.maxUsage,
        maxUsagePerUser: value.maxUsagePerUser,
        minOrderAmount: value.minOrderAmount,
        expiresAt: new Date(value.expiresAt).toISOString(),
        isActive: value.isActive
      };

      await updateMutation.mutateAsync({ id: coupon.id, values: payload });
    }
  });

  const { FormTextField, FormSwitchField } = useFormFields<UpdateCouponFormValues>();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Cập nhật coupon'
      description={`Chỉnh sửa mã giảm giá "${coupon.code}"`}
      formId='coupon-edit-form-dialog'
      isLoading={updateMutation.isPending}
      submitLabel='Cập nhật'
      metaInfo={
        <>
          <Icons.billing className='h-4 w-4' />
          <span>Quản lý coupon</span>
        </>
      }
    >
      <form.AppForm>
        <form.Form id='coupon-edit-form-dialog' className='space-y-6'>
          <FormTextField
            name='code'
            label='Mã coupon'
            required
            placeholder='SUMMER10'
            validators={{
              onBlur: z.string().min(2, 'Mã coupon phải có ít nhất 2 ký tự')
            }}
          />

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormTextField
              name='discountPercent'
              label='Giảm giá (%)'
              required
              placeholder='10'
              type='number'
            />
            <FormTextField
              name='minOrderAmount'
              label='Đơn tối thiểu (VNĐ)'
              required
              placeholder='100.000'
              type='number'
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormTextField
              name='maxUsage'
              label='Lượt dùng tối đa'
              required
              placeholder='100'
              type='number'
            />
            <FormTextField
              name='maxUsagePerUser'
              label='Lượt/người dùng'
              required
              placeholder='1'
              type='number'
            />
          </div>

          <DateTimeField
            label='Ngày hết hạn'
            required
            value={form.getFieldValue('expiresAt') ?? ''}
            onChange={(val) => form.setFieldValue('expiresAt', val)}
          />

          <FormSwitchField name='isActive' label='Hoạt động' />
        </form.Form>
      </form.AppForm>
    </FormDialog>
  );
}
