'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthBrandPanel } from './auth-brand-panel';

/**
 * "Quên mật khẩu" for admins and partners (#016, test round 4). The reset
 * email opens the reset page on esim.vn; the new password then works here.
 */
export function ForgotPasswordView() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setState('sending');
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    }).catch(() => null);
    setState(res && res.ok ? 'sent' : 'error');
  }

  return (
    <div className='relative flex min-h-screen flex-col items-center justify-center overflow-hidden md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <AuthBrandPanel />
      <div className='flex h-full items-center justify-center p-4 lg:p-8'>
        <div className='flex w-full max-w-sm flex-col justify-center space-y-6'>
          <div className='flex flex-col space-y-2 text-center'>
            <h1 className='text-2xl font-semibold tracking-tight'>Quên mật khẩu</h1>
            <p className='text-muted-foreground text-sm'>
              Nhập email đăng nhập, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
            </p>
          </div>
          {state === 'sent' ? (
            <p className='rounded-lg border p-4 text-sm' data-testid='forgot-password-sent'>
              Nếu email này có tài khoản, liên kết đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra
              hộp thư (kể cả mục Spam).
            </p>
          ) : (
            <form onSubmit={submit} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='forgot-email'>Email</Label>
                <Input
                  id='forgot-email'
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='name@example.com'
                  required
                />
              </div>
              {state === 'error' && (
                <p className='text-destructive text-sm'>Không gửi được email, vui lòng thử lại.</p>
              )}
              <Button type='submit' className='w-full' isLoading={state === 'sending'}>
                Gửi liên kết đặt lại mật khẩu
              </Button>
            </form>
          )}
          <p className='text-muted-foreground text-center text-sm'>
            <Link href='/auth/sign-in' className='hover:text-primary underline underline-offset-4'>
              Quay lại đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
