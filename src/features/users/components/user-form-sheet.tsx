'use client';

import { useState } from 'react';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Icons } from '@/components/icons';
import { useMutation } from '@tanstack/react-query';
import { createUserMutation, updateUserMutation } from '../api/mutations';
import type { User, CreateUserPayload, UpdateUserPayload } from '../api/types';
import { toast } from 'sonner';
import * as z from 'zod';
import {
  createUserSchema,
  updateUserSchema,
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

interface UserFormSheetProps {
  user?: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserFormSheet({ user, open, onOpenChange }: UserFormSheetProps) {
  const isEdit = !!user;

  if (isEdit) {
    return <EditUserSheet key={user.id} user={user} open={open} onOpenChange={onOpenChange} />;
  }

  return <CreateUserSheet open={open} onOpenChange={onOpenChange} />;
}

function CreateUserSheet({
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
        role: { id: Number(value.roleId) },
        status: { id: Number(value.statusId) }
      };
      await createMutation.mutateAsync(payload);
    }
  });

  const { FormTextField, FormSelectField } = useFormFields<CreateUserFormValues>();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>Người dùng mới</SheetTitle>
          <SheetDescription>Điền thông tin để tạo người dùng mới.</SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='user-form-sheet' className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
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
                name='password'
                label='Mật khẩu'
                required
                type='password'
                placeholder='Nhập mật khẩu'
                validators={{
                  onBlur: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
                }}
              />

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
            </form.Form>
          </form.AppForm>
        </div>

        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type='submit' form='user-form-sheet' isLoading={createMutation.isPending}>
            <Icons.check /> Tạo người dùng
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function EditUserSheet({
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
      roleId: String(user.role?.id ?? ''),
      statusId: String(user.status?.id ?? '')
    } as UpdateUserFormValues,
    validators: {
      onSubmit: updateUserSchema
    },
    onSubmit: async ({ value }) => {
      const payload: UpdateUserPayload = {
        email: value.email,
        firstName: value.firstName,
        lastName: value.lastName,
        role: { id: Number(value.roleId) },
        status: { id: Number(value.statusId) }
      };
      await updateMutation.mutateAsync({ id: user.id, values: payload });
    }
  });

  const { FormTextField, FormSelectField } = useFormFields<UpdateUserFormValues>();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>Chỉnh sửa người dùng</SheetTitle>
          <SheetDescription>Cập nhật thông tin người dùng bên dưới.</SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='user-form-sheet' className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
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
            </form.Form>
          </form.AppForm>
        </div>

        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type='submit' form='user-form-sheet' isLoading={updateMutation.isPending}>
            <Icons.check /> Cập nhật người dùng
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function UserFormSheetTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Icons.add className='mr-2 h-4 w-4' /> Thêm người dùng
      </Button>
      <UserFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
