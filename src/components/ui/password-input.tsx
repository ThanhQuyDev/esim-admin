'use client';

import * as React from 'react';

import { Icons } from '@/components/icons';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * A password field with its own show/hide eye (doitac-1410 #022).
 *
 * Edge draws a reveal eye of its own, but only until the field first loses
 * focus — clicking back in never brings it back, by design. This button is
 * always there, and the browser's own one is hidden so there are never two.
 */
function PasswordInput({ className, ...props }: Omit<React.ComponentProps<'input'>, 'type'>) {
  const [visible, setVisible] = React.useState(false);
  return (
    <div className='relative'>
      <Input
        {...props}
        type={visible ? 'text' : 'password'}
        className={cn('pr-10 [&::-ms-clear]:hidden [&::-ms-reveal]:hidden', className)}
      />
      <button
        type='button'
        className='text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50'
        aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        aria-pressed={visible}
        disabled={props.disabled}
        // Keep the caret in the field while toggling.
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setVisible((v) => !v)}
        data-testid='password-toggle'
      >
        {visible ? <Icons.eyeOff className='size-4' /> : <Icons.eye className='size-4' />}
      </button>
    </div>
  );
}

export { PasswordInput };
