'use client';

/**
 * The v29 toast: one dark pill bottom-right that fades in for ~2.2s.
 *
 * The portal keeps its own instead of the app's sonner toaster so the shape,
 * position and timing match the design file (`.toast` / `.toast.show`).
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

type ToastFn = (message: string) => void;

const PortalToastContext = createContext<ToastFn>(() => {});

/** Show a portal toast. Safe to call outside the provider (it no-ops). */
export function usePortalToast(): ToastFn {
  return useContext(PortalToastContext);
}

export function PortalToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((next: string) => {
    setMessage(next);
    setVisible(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), 2200);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  return (
    <PortalToastContext.Provider value={toast}>
      {children}
      <div aria-live='polite' className={`toast${visible ? ' show' : ''}`} role='status'>
        {message}
      </div>
    </PortalToastContext.Provider>
  );
}
