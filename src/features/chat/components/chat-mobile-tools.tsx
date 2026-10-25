'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { ChatDestinationSearch } from './chat-destination-search';
import { ChatOrderWidget } from './chat-order-widget';

export type ChatToolSection = 'destinations' | 'orders';

const SECTIONS: Record<ChatToolSection, { title: string; description: string }> = {
  destinations: {
    title: 'Gửi link điểm đến',
    description: 'Tìm quốc gia / khu vực rồi gửi link cho khách.'
  },
  orders: {
    title: 'Đơn hàng của khách',
    description: 'Các đơn hàng của khách đang trò chuyện.'
  }
};

/**
 * The destination search or the customer's orders, for screens too narrow for
 * the side column that shows them on desktop (v3 #006). Each opens on its own
 * from the row of tools under the message box (vande #046), in a bottom sheet.
 */
export function ChatToolSheet({
  section,
  onClose
}: {
  section: ChatToolSection | null;
  onClose: () => void;
}) {
  const info = section ? SECTIONS[section] : null;
  return (
    <Sheet open={!!section} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side='bottom' className='max-h-[85dvh] overflow-y-auto pb-6'>
        <SheetHeader className='px-0'>
          <SheetTitle>{info?.title}</SheetTitle>
          <SheetDescription>{info?.description}</SheetDescription>
        </SheetHeader>
        {section === 'destinations' && <ChatDestinationSearch />}
        {section === 'orders' && <ChatOrderWidget />}
      </SheetContent>
    </Sheet>
  );
}
