'use client';

import { useState, useEffect } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show button when scrolled past 1 viewport height
      setVisible(window.scrollY > window.innerHeight);
    };

    // Also listen on the sidebar-inset main element for scroll events
    const mainEl = document.querySelector('[data-slot="sidebar-inset"]');
    const scrollAreaViewport = mainEl?.querySelector('[data-slot="scroll-area-viewport"]');

    const handleViewportScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      setVisible(target.scrollTop > window.innerHeight);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    scrollAreaViewport?.addEventListener('scroll', handleViewportScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      scrollAreaViewport?.removeEventListener('scroll', handleViewportScroll);
    };
  }, []);

  const scrollToTop = () => {
    // Try scrolling the ScrollArea viewport first
    const mainEl = document.querySelector('[data-slot="sidebar-inset"]');
    const scrollAreaViewport = mainEl?.querySelector('[data-slot="scroll-area-viewport"]');

    if (scrollAreaViewport) {
      scrollAreaViewport.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Button
      variant='outline'
      size='icon'
      className={cn(
        'fixed bottom-6 right-6 z-50 h-10 w-10 rounded-full shadow-lg transition-all duration-300',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      )}
      onClick={scrollToTop}
      aria-label='Cuộn lên đầu trang'
    >
      <Icons.chevronUp className='h-5 w-5' />
    </Button>
  );
}
