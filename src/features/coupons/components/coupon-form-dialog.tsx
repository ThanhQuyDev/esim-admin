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
import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { partnersQueryOptions } from '@/features/partners/api/queries';
import { Badge } from '@/components/ui/badge';
import { couponUsage } from '../utils/usage';

/** Radix Select has no empty-string value, so "no owner" needs a sentinel. */
const NO_PARTNER = 'none';
import * as z from 'zod';
import {
  createCouponSchema,
  updateCouponSchema,
  discountPayload,
  type CreateCouponFormValues,
  type UpdateCouponFormValues
} from '../schemas/coupon';

interface CouponFormDialogProps {
  coupon?: Coupon;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Kinds of discount a code can carry (#082). */
const DISCOUNT_TYPE_OPTIONS = [
  { value: 'percent', label: 'Theo phần trăm (%)' },
  { value: 'fixed', label: 'Theo số tiền' }
];
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
        {required && <span className='text-destructive'> *</span>}
      </label>
      <Input
        type='datetime-local'
        value={value || ''}
        onChange={(e) => {
          const newValue = e.target.value;
          onChange(newValue);
        }}
      />
    </div>
  );
}

/**
 * Owner picker. A coupon with no partner is a house-wide code; picking a
 * partner makes it that KOL's code and surfaces its performance in their
 * portal. It does not change how the discount behaves for the buyer.
 */
function PartnerField({
  value,
  onChange
}: {
  value: number | null | undefined;
  onChange: (val: number | null) => void;
}) {
  const { data, isLoading } = useQuery(partnersQueryOptions({ limit: 50, status: 'active' }));
  const partners = data?.data ?? [];

  return (
    <div className='space-y-2'>
      <label htmlFor='coupon-partner' className='text-sm font-medium'>
        Đối tác sở hữu mã
      </label>
      <Select
        value={value == null ? NO_PARTNER : String(value)}
        onValueChange={(v) => onChange(v === NO_PARTNER ? null : Number(v))}
      >
        <SelectTrigger id='coupon-partner'>
          <SelectValue placeholder='Không gắn đối tác' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_PARTNER}>Không gắn đối tác (mã chung)</SelectItem>
          {partners.map((p) => (
            <SelectItem key={p.id} value={String(p.id)}>
              {p.contactName}
              {p.tierCode ? ` · ${p.tierCode}` : ''} — {p.contactEmail}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className='text-muted-foreground text-xs'>
        {isLoading
          ? 'Đang tải danh sách đối tác…'
          : 'Để trống nếu đây là mã dùng chung. Hoa hồng của đối tác vẫn tính trên giá trị đơn sau khi trừ mã.'}
      </p>
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
      isActive: true,
      isPopular: false,
      isPublic: true,
      discountType: 'percent' as const,
      discountAmount: 0,
      maxDiscountAmount: null,
      partnerId: null
    } as CreateCouponFormValues,
    validators: {
      onSubmit: createCouponSchema
    },
    onSubmit: async ({ value }) => {
      const payload: CreateCouponPayload = {
        code: value.code,
        ...discountPayload(value),
        maxUsage: value.maxUsage,
        maxUsagePerUser: value.maxUsagePerUser,
        minOrderAmount: value.minOrderAmount,
        expiresAt: new Date(value.expiresAt).toISOString(),
        isActive: value.isActive ?? true,
        isPopular: value.isPopular ?? false,
        isPublic: value.isPublic ?? true,
        partnerId: value.partnerId ?? null
      };

      await createMutation.mutateAsync(payload);
    }
  });

  const { FormTextField, FormSelectField, FormSwitchField } =
    useFormFields<CreateCouponFormValues>();

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

          <FormSelectField
            name='discountType'
            label='Kiểu giảm giá'
            options={DISCOUNT_TYPE_OPTIONS}
          />

          {/* Only the fields of the chosen kind of code are shown (#038):
              a percentage with an optional cap, or a flat amount. */}
          <form.Subscribe selector={(state) => state.values.discountType ?? 'percent'}>
            {(discountType) =>
              discountType === 'fixed' ? (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <FormTextField
                    name='discountAmount'
                    label='Giảm giá số tiền (VNĐ)'
                    required
                    placeholder='50000'
                    type='number'
                  />
                  <FormTextField
                    name='minOrderAmount'
                    label='Đơn tối thiểu (VNĐ)'
                    required
                    placeholder='100000'
                    type='number'
                  />
                </div>
              ) : (
                <>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <FormTextField
                      name='discountPercent'
                      label='Giảm giá theo %'
                      required
                      placeholder='10'
                      type='number'
                    />
                    <FormTextField
                      name='minOrderAmount'
                      label='Đơn tối thiểu (VNĐ)'
                      required
                      placeholder='100000'
                      type='number'
                    />
                  </div>
                  <FormTextField
                    name='maxDiscountAmount'
                    label='Giảm tối đa (VNĐ)'
                    placeholder='50000'
                    type='number'
                    description='Không bắt buộc — để trống là không giới hạn.'
                  />
                </>
              )
            }
          </form.Subscribe>

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

          <form.Field name='expiresAt'>
            {(field) => (
              <DateTimeField
                label='Ngày hết hạn'
                required
                value={field.state.value ?? ''}
                onChange={(val) => field.handleChange(val)}
              />
            )}
          </form.Field>

          <form.Field name='partnerId'>
            {(field) => (
              <PartnerField value={field.state.value} onChange={(val) => field.handleChange(val)} />
            )}
          </form.Field>

          <FormSwitchField name='isActive' label='Hoạt động' />
          <FormSwitchField
            name='isPopular'
            label='Mã nổi bật (hiển thị khi nhấn "Lấy mã" trên web)'
          />
          {/* Private codes still work when typed in — they are just never
              listed on the cart page (#081). */}
          <FormSwitchField
            name='isPublic'
            label='Công khai (hiện trong danh sách mã ở trang giỏ hàng)'
          />
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
    ? (() => {
        const d = new Date(coupon.expiresAt);
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      })()
    : '';

  const form = useAppForm({
    defaultValues: {
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      maxUsage: coupon.maxUsage,
      maxUsagePerUser: coupon.maxUsagePerUser,
      minOrderAmount: coupon.minOrderAmount,
      expiresAt: expiresAtLocal,
      isActive: coupon.isActive,
      isPopular: coupon.isPopular,
      isPublic: coupon.isPublic ?? true,
      discountType: coupon.discountType ?? ('percent' as const),
      discountAmount: coupon.discountAmount ?? 0,
      maxDiscountAmount: coupon.maxDiscountAmount ?? null,
      partnerId: coupon.partnerId ?? null
    } as UpdateCouponFormValues,
    validators: {
      onSubmit: updateCouponSchema
    },
    onSubmit: async ({ value }) => {
      const payload: UpdateCouponPayload = {
        code: value.code,
        ...discountPayload(value),
        maxUsage: value.maxUsage,
        maxUsagePerUser: value.maxUsagePerUser,
        minOrderAmount: value.minOrderAmount,
        expiresAt: new Date(value.expiresAt).toISOString(),
        isActive: value.isActive,
        isPopular: value.isPopular,
        isPublic: value.isPublic,
        partnerId: value.partnerId ?? null
      };

      await updateMutation.mutateAsync({ id: coupon.id, values: payload });
    }
  });

  const { FormTextField, FormSelectField, FormSwitchField } =
    useFormFields<UpdateCouponFormValues>();

  const usage = couponUsage(coupon);

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
          {/* Read-only: how much of this code is already spent (#083). The
              admin is usually here to raise or lower the limit. */}
          <div className='bg-muted/40 flex items-center justify-between rounded-md border px-3 py-2 text-sm'>
            <span className='text-muted-foreground'>Lượt đã sử dụng</span>
            <span className='flex items-center gap-2 font-medium tabular-nums'>
              {usage.label}
              {usage.isExhausted && <Badge variant='destructive'>Hết lượt</Badge>}
              {usage.isRunningOut && <Badge variant='outline'>Sắp hết</Badge>}
            </span>
          </div>
          <FormTextField
            name='code'
            label='Mã coupon'
            required
            placeholder='SUMMER10'
            validators={{
              onBlur: z.string().min(2, 'Mã coupon phải có ít nhất 2 ký tự')
            }}
          />

          <FormSelectField
            name='discountType'
            label='Kiểu giảm giá'
            options={DISCOUNT_TYPE_OPTIONS}
          />

          {/* Only the fields of the chosen kind of code are shown (#038):
              a percentage with an optional cap, or a flat amount. */}
          <form.Subscribe selector={(state) => state.values.discountType ?? 'percent'}>
            {(discountType) =>
              discountType === 'fixed' ? (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <FormTextField
                    name='discountAmount'
                    label='Giảm giá số tiền (VNĐ)'
                    required
                    placeholder='50000'
                    type='number'
                  />
                  <FormTextField
                    name='minOrderAmount'
                    label='Đơn tối thiểu (VNĐ)'
                    required
                    placeholder='100000'
                    type='number'
                  />
                </div>
              ) : (
                <>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <FormTextField
                      name='discountPercent'
                      label='Giảm giá theo %'
                      required
                      placeholder='10'
                      type='number'
                    />
                    <FormTextField
                      name='minOrderAmount'
                      label='Đơn tối thiểu (VNĐ)'
                      required
                      placeholder='100000'
                      type='number'
                    />
                  </div>
                  <FormTextField
                    name='maxDiscountAmount'
                    label='Giảm tối đa (VNĐ)'
                    placeholder='50000'
                    type='number'
                    description='Không bắt buộc — để trống là không giới hạn.'
                  />
                </>
              )
            }
          </form.Subscribe>

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

          <form.Field name='expiresAt'>
            {(field) => (
              <DateTimeField
                label='Ngày hết hạn'
                required
                value={field.state.value ?? ''}
                onChange={(val) => field.handleChange(val)}
              />
            )}
          </form.Field>

          <form.Field name='partnerId'>
            {(field) => (
              <PartnerField value={field.state.value} onChange={(val) => field.handleChange(val)} />
            )}
          </form.Field>

          <FormSwitchField name='isActive' label='Hoạt động' />
          <FormSwitchField
            name='isPopular'
            label='Mã nổi bật (hiển thị khi nhấn "Lấy mã" trên web)'
          />
          {/* Private codes still work when typed in — they are just never
              listed on the cart page (#081). */}
          <FormSwitchField
            name='isPublic'
            label='Công khai (hiện trong danh sách mã ở trang giỏ hàng)'
          />
        </form.Form>
      </form.AppForm>
    </FormDialog>
  );
}
