'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as z from 'zod';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { changePassword } from '@/features/auth/api/service';

/**
 * Lets a signed-in staff member change their own login password (#066).
 *
 * The API has supported this all along (`PATCH /auth/me` with the old password);
 * the dashboard simply had no screen for it, so an admin who wanted a new
 * password had to ask someone with database access.
 *
 * Changing it signs every other session out, which is the point when a password
 * is being rotated because it may have leaked — the form says so.
 */
const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    password: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu mới')
  })
  .superRefine((value, context) => {
    if (value.password !== value.confirmPassword) {
      context.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'Mật khẩu nhập lại không khớp'
      });
    }
    if (value.password && value.password === value.oldPassword) {
      context.addIssue({
        code: 'custom',
        path: ['password'],
        message: 'Mật khẩu mới phải khác mật khẩu hiện tại'
      });
    }
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

const FORM_ID = 'change-password-form';

export function ChangePasswordCard() {
  const [changedAt, setChangedAt] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công');
      setChangedAt(Date.now());
      form.reset();
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const form = useAppForm({
    defaultValues: {
      oldPassword: '',
      password: '',
      confirmPassword: ''
    } as ChangePasswordValues,
    validators: { onSubmit: changePasswordSchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        oldPassword: value.oldPassword,
        password: value.password
      });
    }
  });

  const { FormTextField } = useFormFields<ChangePasswordValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Đổi mật khẩu</CardTitle>
        <CardDescription>
          Sau khi đổi, các thiết bị khác đang đăng nhập tài khoản này sẽ bị đăng xuất.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form id={FORM_ID} className='max-w-md space-y-4'>
            <FormTextField
              name='oldPassword'
              label='Mật khẩu hiện tại'
              required
              type='password'
              placeholder='Nhập mật khẩu đang dùng'
            />
            <FormTextField
              name='password'
              label='Mật khẩu mới'
              required
              type='password'
              placeholder='Ít nhất 6 ký tự'
            />
            <FormTextField
              name='confirmPassword'
              label='Nhập lại mật khẩu mới'
              required
              type='password'
              placeholder='Nhập lại mật khẩu mới'
            />

            <div className='flex items-center gap-3'>
              <form.SubmitButton disabled={mutation.isPending}>
                {mutation.isPending ? 'Đang lưu...' : 'Đổi mật khẩu'}
              </form.SubmitButton>
              {changedAt !== null && !mutation.isPending && (
                <span className='text-muted-foreground text-sm'>Đã cập nhật</span>
              )}
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
