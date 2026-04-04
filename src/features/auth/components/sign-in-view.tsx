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
import { login } from '../api/service';
import { InteractiveGridPattern } from './interactive-grid';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your account'
};

const loginSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' })
});

export default function SignInViewPage() {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      router.push('/dashboard/overview');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Login failed');
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
      <Link
        href='/auth/sign-up'
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute top-4 right-4 md:top-8 md:right-8'
        )}
      >
        Sign Up
      </Link>
      <div className='bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r'>
        <div className='absolute inset-0 bg-zinc-900' />
        <div className='relative z-20 flex items-center text-lg font-medium'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='mr-2 h-6 w-6'
          >
            <path d='M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3' />
          </svg>
          Logo
        </div>
        <InteractiveGridPattern
          className={cn(
            'mask-[radial-gradient(400px_circle_at_center,white,transparent)]',
            'inset-x-0 inset-y-[0%] h-full skew-y-12'
          )}
        />
        <div className='relative z-20 mt-auto'>
          <blockquote className='space-y-2'>
            <p className='text-lg'>
              &ldquo;This starter template has saved me countless hours of work and helped me
              deliver projects to my clients faster than ever before.&rdquo;
            </p>
            <footer className='text-sm'>Random Dude</footer>
          </blockquote>
        </div>
      </div>
      <div className='flex h-full items-center justify-center p-4 lg:p-8'>
        <div className='flex w-full max-w-sm flex-col justify-center space-y-6'>
          <div className='flex flex-col space-y-2 text-center'>
            <h1 className='text-2xl font-semibold tracking-tight'>Sign In</h1>
            <p className='text-muted-foreground text-sm'>
              Enter your credentials to access your account
            </p>
          </div>
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
                      <Label htmlFor={field.name}>Password</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type='password'
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder='Enter your password'
                        disabled={mutation.isPending}
                      />
                    </field.Field>
                    <field.FieldError />
                  </field.FieldSet>
                )}
              />
              <form.SubmitButton className='w-full'>
                Sign In
              </form.SubmitButton>
            </form.Form>
          </form.AppForm>
          <p className='text-muted-foreground text-center text-sm'>
            Don&apos;t have an account?{' '}
            <Link
              href='/auth/sign-up'
              className='hover:text-primary underline underline-offset-4'
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
