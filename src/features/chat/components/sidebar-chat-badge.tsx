'use client';

import { useChatStore } from '../utils/store';

/**
 * How many customers are waiting for a reply, shown on the Trò chuyện menu (#070).
 *
 * Admins were missing chats because the only signal was a notification sound,
 * which is easy to mute or not hear. The count is live: the chat socket is
 * already connected app-wide by `ChatNotificationListener`, so this needs no
 * polling of its own.
 *
 * "Waiting" means the room has messages the admin has not read — the same
 * `unreadCount` the conversation list shows, so the two can never disagree.
 */
export function SidebarChatBadge() {
  const waitingRooms = useChatStore((s) => s.rooms.filter((room) => room.unreadCount > 0).length);

  if (waitingRooms <= 0) return null;

  return (
    <span
      data-testid='sidebar-chat-badge'
      className='ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white tabular-nums'
      aria-label={`${waitingRooms} khách đang chờ trả lời`}
      title={`${waitingRooms} khách đang chờ trả lời`}
    >
      {waitingRooms > 99 ? '99+' : waitingRooms}
    </span>
  );
}
