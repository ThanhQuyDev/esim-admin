'use client';

import { useState } from 'react';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { FormDialog } from '@/components/ui/form-dialog';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useMutation } from '@tanstack/react-query';
import { createUserMutation, updateUserMutation } from '../api/mutations';
import type { User, CreateUserPayload, UpdateUserPayload } from '../api/types';
import { toast } from 'sonner';
import { formatVnd } from '@/lib/format';
import * as z from 'zod';
import {
  createUserSchema,
  updateUserSchema,
  phoneNumberSchema,
  type CreateUserFormValues,
  type UpdateUserFormValues
} from '../schemas/user';

const API_ROLE_OPTIONS = [
  { value: '1', label: 'Admin' },
  { value: '2', label: 'User' }
];

const API_STATUS_OPTIONS = [
  { value: '1', label: 'Hoạt động' },
  { value: '2', label: 'Không hoạt động' }
];

const TIER_OPTIONS = [
  { value: 'auto', label: 'Tự động theo chi tiêu' },
  { value: 'traveler', label: 'Du khách' },
  { value: 'silver', label: 'Du khách bạc' },
  { value: 'gold', label: 'Du khách vàng' },
  { value: 'platinum', label: 'Du khách bạch kim' }
];

const TIER_LABELS = {
  traveler: 'Du khách',
  silver: 'Du khách bạc',
  gold: 'Du khách vàng',
  platinum: 'Du khách bạch kim'
} as const;

interface UserFormDialogProps {
  user?: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserFormDialog({ user, open, onOpenChange }: UserFormDialogProps) {
  const isEdit = !!user;

  if (isEdit) {
    return <EditUserDialog key={user.id} user={user} open={open} onOpenChange={onOpenChange} />;
  }

  return <CreateUserDialog open={open} onOpenChange={onOpenChange} />;
}

function CreateUserDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createMutation = useMutation({
    ...createUserMutation,
    onSuccess: () => {
      toast.success('Tạo người dùng thành công');
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => toast.error(error.message || 'Tạo người dùng thất bại')
  });

  const form = useAppForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      roleId: '',
      statusId: '1'
    } as CreateUserFormValues,
    validators: {
      onSubmit: createUserSchema
    },
    onSubmit: async ({ value }) => {
      const payload: CreateUserPayload = {
        email: value.email,
        password: value.password,
        firstName: value.firstName,
        lastName: value.lastName,
        phoneNumber: value.phoneNumber.trim() || null,
        role: { id: Number(value.roleId) },
        status: { id: Number(value.statusId) }
      };
      await createMutation.mutateAsync(payload);
    }
  });

  const { FormTextField, FormSelectField } = useFormFields<CreateUserFormValues>();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Người dùng mới'
      description='Điền thông tin để tạo người dùng mới trong hệ thống'
      formId='user-form-dialog'
      isLoading={createMutation.isPending}
      submitLabel='Tạo người dùng'
      metaInfo={
        <>
          <Icons.user className='h-4 w-4' />
          <span>Quản lý người dùng</span>
        </>
      }
    >
      <form.AppForm>
        <form.Form id='user-form-dialog' className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormTextField
              name='firstName'
              label='Họ'
              required
              placeholder='Nguyễn'
              validators={{
                onBlur: z.string().min(2, 'Họ phải có ít nhất 2 ký tự')
              }}
            />
            <FormTextField
              name='lastName'
              label='Tên'
              required
              placeholder='Văn A'
              validators={{
                onBlur: z.string().min(2, 'Tên phải có ít nhất 2 ký tự')
              }}
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormTextField
              name='email'
              label='Email'
              required
              type='email'
              placeholder='nguyen@example.com'
              validators={{
                onBlur: z.string().email('Vui lòng nhập email hợp lệ')
              }}
            />
            <FormTextField
              name='phoneNumber'
              label='Số điện thoại'
              type='tel'
              placeholder='0901234567'
              validators={{ onBlur: phoneNumberSchema }}
            />
          </div>

          <FormTextField
            name='password'
            label='Mật khẩu'
            required
            type='password'
            placeholder='Nhập mật khẩu'
            validators={{
              onBlur: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
            }}
          />

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormSelectField
              name='roleId'
              label='Vai trò'
              required
              options={API_ROLE_OPTIONS}
              placeholder='Chọn vai trò'
              validators={{
                onBlur: z.string().min(1, 'Vui lòng chọn vai trò')
              }}
            />

            <FormSelectField
              name='statusId'
              label='Trạng thái'
              required
              options={API_STATUS_OPTIONS}
              placeholder='Chọn trạng thái'
              validators={{
                onBlur: z.string().min(1, 'Vui lòng chọn trạng thái')
              }}
            />
          </div>
        </form.Form>
      </form.AppForm>
    </FormDialog>
  );
}

function EditUserDialog({
  user,
  open,
  onOpenChange
}: {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateMutation = useMutation({
    ...updateUserMutation,
    onSuccess: () => {
      toast.success('Cập nhật người dùng thành công');
      onOpenChange(false);
    },
    onError: (error) => toast.error(error.message || 'Cập nhật người dùng thất bại')
  });

  const form = useAppForm({
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber ?? '',
      roleId: String(user.role?.id ?? ''),
      statusId: String(user.status?.id ?? ''),
      tierOverride: user.tierOverride ?? 'auto',
      tierOverrideReason: user.tierOverrideReason ?? ''
    } as UpdateUserFormValues,
    validators: {
      onSubmit: updateUserSchema
    },
    onSubmit: async ({ value }) => {
      const payload: UpdateUserPayload = {
        email: value.email,
        firstName: value.firstName,
        lastName: value.lastName,
        phoneNumber: value.phoneNumber.trim() || null,
        tierOverride: value.tierOverride === 'auto' ? null : value.tierOverride,
        tierOverrideReason: value.tierOverride === 'auto' ? null : value.tierOverrideReason.trim(),
        role: { id: Number(value.roleId) },
        status: { id: Number(value.statusId) }
      };
      await updateMutation.mutateAsync({ id: user.id, values: payload });
    }
  });

  const { FormTextField, FormSelectField, FormTextareaField } =
    useFormFields<UpdateUserFormValues>();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Chỉnh sửa người dùng'
      description='Cập nhật thông tin người dùng trong hệ thống'
      formId='user-form-dialog'
      isLoading={updateMutation.isPending}
      submitLabel='Cập nhật người dùng'
      metaInfo={
        <>
          <Icons.edit className='h-4 w-4' />
          <span>ID: {user.id}</span>
        </>
      }
    >
      <form.AppForm>
        <form.Form id='user-form-dialog' className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormTextField
              name='firstName'
              label='Họ'
              required
              placeholder='Nguyễn'
              validators={{
                onBlur: z.string().min(2, 'Họ phải có ít nhất 2 ký tự')
              }}
            />
            <FormTextField
              name='lastName'
              label='Tên'
              required
              placeholder='Văn A'
              validators={{
                onBlur: z.string().min(2, 'Tên phải có ít nhất 2 ký tự')
              }}
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormTextField
              name='email'
              label='Email'
              required
              type='email'
              placeholder='nguyen@example.com'
              validators={{
                onBlur: z.string().email('Vui lòng nhập email hợp lệ')
              }}
            />
            <FormTextField
              name='phoneNumber'
              label='Số điện thoại'
              type='tel'
              placeholder='0901234567'
              validators={{ onBlur: phoneNumberSchema }}
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormSelectField
              name='roleId'
              label='Vai trò'
              required
              options={API_ROLE_OPTIONS}
              placeholder='Chọn vai trò'
              validators={{
                onBlur: z.string().min(1, 'Vui lòng chọn vai trò')
              }}
            />

            <FormSelectField
              name='statusId'
              label='Trạng thái'
              required
              options={API_STATUS_OPTIONS}
              placeholder='Chọn trạng thái'
              validators={{
                onBlur: z.string().min(1, 'Vui lòng chọn trạng thái')
              }}
            />
          </div>

          <div className='rounded-xl border bg-muted/40 p-4'>
            <p className='text-sm font-medium'>Hạng tự động: {TIER_LABELS[user.automaticTier]}</p>
            <p className='text-muted-foreground mt-1 text-sm'>
              Tổng chi tiêu: {formatVnd(user.lifetimeSpendVnd)}
            </p>
          </div>

          <FormSelectField
            name='tierOverride'
            label='Hạng thành viên'
            options={TIER_OPTIONS}
            description='Hạng thủ công thay thế toàn bộ quyền lợi tự động.'
          />

          <form.Subscribe selector={(state) => state.values.tierOverride}>
            {(tierOverride) =>
              tierOverride !== 'auto' ? (
                <FormTextareaField
                  name='tierOverrideReason'
                  label='Lý do điều chỉnh'
                  required
                  placeholder='Nhập lý do điều chỉnh hạng thành viên...'
                  maxLength={500}
                />
              ) : null
            }
          </form.Subscribe>
        </form.Form>
      </form.AppForm>
    </FormDialog>
  );
}

export function UserFormDialogTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Icons.add className='mr-2 h-4 w-4' /> Thêm người dùng
      </Button>
      <UserFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
