import * as React from 'react';

import { cn } from '@/lib/utils';

/** A search box says so in its hint; order lookups start with what they take. */
const SEARCH_HINT = /^(tìm|search|mã đơn)/i;

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  // The browser's own clear button, styled in globals.css (vande-0411 #054).
  const inputType = type ?? (SEARCH_HINT.test(props.placeholder ?? '') ? 'search' : undefined);
  return (
    <input
      type={inputType}
      data-slot='input'
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className
      )}
      {...props}
    />
  );
}

export { Input };
