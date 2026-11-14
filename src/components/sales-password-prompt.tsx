'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IS_PARTNER_PORTAL } from '@/config/app-mode';
import { registerSalesPasswordPrompt, type SalesPasswordReason } from '@/lib/sales-password-prompt';

/** Where the sales password is set: the profile (vande-1411 #004). */
export const SALES_PASSWORD_PROFILE_HREF = IS_PARTNER_PORTAL
  ? '/dashboard/portal/profile?tab=security'
  : '/dashboard/profile';

type Ask = { reason: SalesPasswordReason; message: string; resolve: (v: string | null) => void };

/**
 * The dialog that asks for the "mật khẩu bán hàng" before a money
 * transaction goes through (vande-1411 #004). Mounted once in the dashboard;
 * `apiClient` opens it when the server asks.
 */
export function SalesPasswordPrompt() {
  const [ask, setAsk] = useState<Ask | null>(null);
  const [value, setValue] = useState('');
  const pending = useRef<Ask | null>(null);

  useEffect(
    () =>
      registerSalesPasswordPrompt(
        (reason, message) =>
          new Promise<string | null>((resolve) => {
            // A second ask while one is open replaces it; the first gets null.
            pending.current?.resolve(null);
            const next = { reason, message, resolve };
            pending.current = next;
            setValue('');
            setAsk(next);
          })
      ),
    []
  );

  const close = (result: string | null) => {
    const current = pending.current;
    pending.current = null;
    setAsk(null);
    setValue('');
    current?.resolve(result);
  };

  const canType = ask?.reason === 'required' || ask?.reason === 'invalid';

  return (
    <Dialog open={!!ask} onOpenChange={(open) => !open && close(null)}>
      <DialogContent className='sm:max-w-md' data-testid='sales-password-prompt'>
        <DialogHeader>
          <DialogTitle>Xác nhận giao dịch — Mật khẩu bán hàng</DialogTitle>
          <DialogDescription>
            {canType
              ? 'Giao dịch có liên quan tới tiền. Nhập mật khẩu bán hàng để tiếp tục.'
              : ask?.message}
          </DialogDescription>
        </DialogHeader>
        {canType ? (
          <form
            id='sales-password-form'
            className='space-y-2'
            onSubmit={(e) => {
              e.preventDefault();
              if (value) close(value);
            }}
          >
            <Label htmlFor='sales-password-input'>Mật khẩu bán hàng</Label>
            <Input
              id='sales-password-input'
              type='password'
              autoComplete='off'
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              data-testid='sales-password-input'
            />
            {ask?.reason === 'invalid' && (
              <p className='text-destructive text-sm' data-testid='sales-password-error'>
                {ask.message}
              </p>
            )}
            <p className='text-muted-foreground text-xs'>
              Quên mật khẩu bán hàng?{' '}
              <Link
                href={SALES_PASSWORD_PROFILE_HREF}
                className='underline underline-offset-4'
                onClick={() => close(null)}
              >
                Đặt lại trong Hồ sơ
              </Link>
            </p>
          </form>
        ) : null}
        <DialogFooter>
          <Button type='button' variant='outline' onClick={() => close(null)}>
            {canType ? 'Huỷ' : 'Đóng'}
          </Button>
          {canType ? (
            <Button
              type='submit'
              form='sales-password-form'
              disabled={!value}
              data-testid='sales-password-submit'
            >
              Xác nhận
            </Button>
          ) : (
            <Button asChild onClick={() => close(null)}>
              <Link href={SALES_PASSWORD_PROFILE_HREF}>
                {ask?.reason === 'not_set' ? 'Tạo mật khẩu bán hàng' : 'Đặt lại mật khẩu bán hàng'}
              </Link>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
