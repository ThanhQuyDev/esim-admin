'use client';

import { useState } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { ChatDestinationSearch } from './chat-destination-search';
import { ChatOrderWidget } from './chat-order-widget';

/**
 * The destination search and the customer's orders, for screens too narrow for
 * the side column that shows them on desktop (v3 #006). A button beside the
 * attach button opens them in a bottom sheet — the Shopee-style chat menu the
 * tester asked for.
 */
export function ChatMobileTools() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='border-border/40 bg-background/70 text-muted-foreground hover:bg-muted/50 size-8 rounded-full border sm:size-10 lg:hidden'
          aria-label='Gửi link điểm đến, xem đơn hàng của khách'
          data-testid='chat-mobile-tools'
        >
          <Icons.plusCircle className='h-3.5 w-3.5 sm:h-4 sm:w-4' />
        </Button>
      </SheetTrigger>
      <SheetContent side='bottom' className='max-h-[85dvh] overflow-y-auto pb-6'>
        <SheetHeader className='px-0'>
          <SheetTitle>Công cụ trò chuyện</SheetTitle>
          <SheetDescription>
            Gửi link điểm đến cho khách, hoặc xem đơn hàng của khách.
          </SheetDescription>
        </SheetHeader>
        <div className='space-y-3'>
          <ChatDestinationSearch />
          <ChatOrderWidget />
        </div>
      </SheetContent>
    </Sheet>
  );
}
