'use client';

import { useEffect, useState } from 'react';

/**
 * How much of the bottom of the screen the on-screen keyboard covers, and how
 * tall the part it leaves is. `position: fixed; bottom: 0` is measured from the
 * layout viewport, which the keyboard does not shrink on iOS or on recent Chrome
 * for Android, so a bottom sheet ends up behind it (vande-0411 #078).
 */
export function useKeyboardInset(enabled: boolean): { bottom: number; height: number } | null {
  const [inset, setInset] = useState<{ bottom: number; height: number } | null>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!enabled || !viewport) {
      setInset(null);
      return;
    }
    const update = () => {
      const layoutHeight = document.documentElement.clientHeight;
      const bottom = Math.max(0, layoutHeight - viewport.offsetTop - viewport.height);
      // Below this it is a browser toolbar sliding, not a keyboard.
      setInset(bottom > 80 ? { bottom, height: viewport.height } : null);
    };
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, [enabled]);
  return inset;
}
