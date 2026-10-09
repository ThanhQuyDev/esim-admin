'use client';

import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';
import { Metadata } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppForm } from '@/components/ui/tanstack-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { useState } from 'react';
import { LoginError, login } from '../api/service';
import { HOME_PATH } from '@/config/app-mode';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Icons } from '@/components/icons';
import { AuthBrandPanel, useAuthPageContent } from './auth-brand-panel';

export const metadata: Metadata = {
  title: 'Đăng nhập',
  description: 'Đăng nhập vào tài khoản của bạn'
};

const loginSchema = z.object({
  email: z.string().email({ message: 'Nhập địa chỉ email hợp lệ' }),
  password: z.string().min(1, { message: 'Mật khẩu là bắt buộc' })
});

export default function SignInViewPage() {
  const router = useRouter();
  // A partner application still waiting on approval is told so right here,
  // instead of being let into a portal with nothing behind its menus (#001).
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);

  // Logo, cover image and copy come from the CMS (#006).
  const content = useAuthPageContent();

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      setPendingNotice(null);
      router.push(HOME_PATH);
    },
    onError: (error: Error) => {
      if (error instanceof LoginError && error.code === 'partnerPending') {
        setPendingNotice(error.message);
        return;
      }
      setPendingNotice(null);
      toast.error(error.message || 'Đăng nhập thất bại');
    }
  });

  const form = useAppForm({
    defaultValues: {
      email: '',
      password: ''
    },
    validators: {
      onSubmit: loginSchema
    },
    onSubmit: ({ value }) => {
      mutation.mutate(value);
    }
  });

  return (
    <div className='relative flex min-h-screen flex-col items-center justify-center overflow-hidden md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      {/* Partner portal only — admin accounts are never self-made (#016). */}
      {content.signUpUrl && (
        <Link
          href={content.signUpUrl}
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            'absolute top-4 right-4 md:top-8 md:right-8'
          )}
        >
          Đăng ký
        </Link>
      )}
      <AuthBrandPanel />
      <div className='flex h-full items-center justify-center p-4 lg:p-8'>
        <div className='flex w-full max-w-sm flex-col justify-center space-y-6'>
          <div className='flex flex-col space-y-2 text-center'>
            <h1 className='text-2xl font-semibold tracking-tight'>{content.heading}</h1>
            <p className='text-muted-foreground text-sm'>{content.subheading}</p>
          </div>
          {pendingNotice && (
            <Alert>
              <Icons.clock />
              <AlertTitle>Hồ sơ đối tác đang chờ xét duyệt</AlertTitle>
              <AlertDescription>{pendingNotice}</AlertDescription>
            </Alert>
          )}
          <form.AppForm>
            <form.Form className='space-y-4'>
              <form.AppField
                name='email'
                children={(field) => (
                  <field.FieldSet>
                    <field.Field>
                      <Label htmlFor={field.name}>Email</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type='email'
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder='name@example.com'
                        disabled={mutation.isPending}
                      />
                    </field.Field>
                    <field.FieldError />
                  </field.FieldSet>
                )}
              />
              <form.AppField
                name='password'
                children={(field) => (
                  <field.FieldSet>
                    <field.Field>
                      <Label htmlFor={field.name}>Mật khẩu</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type='password'
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder='Nhập mật khẩu'
                        disabled={mutation.isPending}
                      />
                    </field.Field>
                    <field.FieldError />
                  </field.FieldSet>
                )}
              />
              <div className='flex justify-end'>
                <Link
                  href='/auth/forgot-password'
                  className='text-muted-foreground hover:text-primary text-sm underline-offset-4 hover:underline'
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <form.SubmitButton className='w-full'>Đăng nhập</form.SubmitButton>
            </form.Form>
          </form.AppForm>
          {content.signUpUrl && (
            <p className='text-muted-foreground text-center text-sm'>
              Chưa có tài khoản?{' '}
              <Link
                href={content.signUpUrl}
                className='hover:text-primary underline underline-offset-4'
              >
                Đăng ký
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
