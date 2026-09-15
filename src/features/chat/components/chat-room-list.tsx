'use client';

import { useMemo, useState } from 'react';
import { Icons } from '@/components/icons';
import { motion } from 'motion/react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useChatStore } from '../utils/store';
import type { ChatRoomWithMeta } from '../api/types';
import { formatDistanceToNow } from '@/features/chat/utils/format';

function getRoomInitials(email: string | undefined, userId: number): string {
  if (email) {
    return email.charAt(0).toUpperCase();
  }
  return `U${userId}`;
}

/**
 * A conversation nobody has answered yet (#072).
 *
 * Compared against the room OWNER rather than the signed-in admin: when a
 * colleague replies the room is answered, and treating their reply as
 * unanswered would have every admin chasing the same conversations.
 */
function isAwaitingReply(room: ChatRoomWithMeta): boolean {
  return room.lastMessage ? room.lastMessage.senderId === room.userId : false;
}

type RoomFilter = 'all' | 'unread' | 'awaiting';

const FILTER_LABELS: Record<RoomFilter, string> = {
  all: 'Tất cả',
  unread: 'Chưa đọc',
  awaiting: 'Chưa phản hồi'
};
export function ChatRoomList() {
  const rooms = useChatStore((s) => s.rooms);
  const selectedRoomId = useChatStore((s) => s.selectedRoomId);
  const selectRoom = useChatStore((s) => s.selectRoom);
  const userCache = useChatStore((s) => s.userCache);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<RoomFilter>('all');

  const counts = useMemo(
    () => ({
      all: rooms.length,
      unread: rooms.filter((r) => r.unreadCount > 0).length,
      awaiting: rooms.filter(isAwaitingReply).length
    }),
    [rooms]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const byName = q
      ? rooms.filter((r) => {
          const user = userCache[r.userId];
          const displayName = user?.email ?? `Người dùng #${r.userId}`;
          return displayName.toLowerCase().includes(q);
        })
      : rooms;

    const matched =
      filter === 'unread'
        ? byName.filter((r) => r.unreadCount > 0)
        : filter === 'awaiting'
          ? byName.filter(isAwaitingReply)
          : byName;

    // Sort by most recent activity (newest message first). Fall back to the
    // room's updatedAt/createdAt when a room has no messages yet.
    const activityTime = (r: ChatRoomWithMeta) =>
      new Date(r.lastMessage?.createdAt ?? r.updatedAt ?? r.createdAt).getTime();

    return [...matched].sort((a, b) => activityTime(b) - activityTime(a));
  }, [rooms, search, userCache, filter]);

  return (
    <div
      className={cn(
        'border-border/40 bg-background/75 h-full flex-col gap-4 overflow-hidden rounded-2xl border p-3 backdrop-blur lg:col-start-1 lg:col-end-2 lg:flex lg:rounded-3xl lg:p-4',
        selectedRoomId ? 'hidden lg:flex' : 'flex'
      )}
    >
      <div className='flex items-center justify-between gap-3'>
        <div>
          <p className='text-foreground text-sm font-semibold'>Trò chuyện</p>
          <p className='text-muted-foreground text-xs'>{rooms.length} cuộc trò chuyện</p>
        </div>
        <Badge
          variant='outline'
          className='bg-primary/15 text-primary hover:bg-primary/15 hover:text-primary border-border/50 rounded-full border px-3 py-1 text-[0.7rem] tracking-[0.24em] uppercase'
        >
          Trực tuyến
        </Badge>
      </div>

      <label htmlFor='messenger-search' className='sr-only'>
        Tìm kiếm cuộc trò chuyện
      </label>
      <div className='relative'>
        <Icons.search
          className='text-muted-foreground/70 pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2'
          aria-hidden='true'
        />
        <Input
          id='messenger-search'
          type='search'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Tìm kiếm cuộc trò chuyện'
          // 16px on phones, or iOS zooms the page in on focus (#007).
          className='border-border/40 bg-background/60 text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-primary/40 w-full rounded-2xl pl-10 text-base focus-visible:ring-2 sm:text-sm'
        />
      </div>

      {/* Unread / awaiting-reply filters (#072) — the counts make it obvious
          how much is outstanding before anything is clicked. */}
      <div className='flex flex-wrap gap-1.5' role='group' aria-label='Lọc cuộc trò chuyện'>
        {(Object.keys(FILTER_LABELS) as RoomFilter[]).map((key) => {
          const isActive = filter === key;
          const count = counts[key];
          return (
            <button
              key={key}
              type='button'
              onClick={() => setFilter(key)}
              aria-pressed={isActive}
              data-testid={`chat-filter-${key}`}
              className={cn(
                'focus-visible:ring-primary/40 rounded-full border px-2.5 py-1 text-[0.7rem] font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none',
                isActive
                  ? 'border-primary/40 bg-primary/15 text-primary'
                  : 'border-border/40 bg-background/60 text-muted-foreground hover:bg-muted/50'
              )}
            >
              {FILTER_LABELS[key]}
              {count > 0 && key !== 'all' ? ` (${count})` : ''}
            </button>
          );
        })}
      </div>
      <div
        className='flex-1 space-y-2 overflow-y-auto pr-1'
        aria-label='Danh sách cuộc trò chuyện'
        role='list'
      >
        {filtered.length === 0 ? (
          <p className='text-muted-foreground py-8 text-center text-xs'>
            {filter === 'unread'
              ? 'Không có tin nhắn chưa đọc'
              : filter === 'awaiting'
                ? 'Không có cuộc trò chuyện nào đang chờ trả lời'
                : 'Không tìm thấy cuộc trò chuyện'}
          </p>
        ) : null}
        {filtered.map((room) => {
          const isActive = room.id === selectedRoomId;
          const user = userCache[room.userId];
          const displayName = user?.email ?? `Người dùng #${room.userId}`;
          const initials = getRoomInitials(user?.email, room.userId);
          const lastMsg = room.lastMessage;

          return (
            <motion.button
              key={room.id}
              type='button'
              onClick={() => selectRoom(room.id, room.userId)}
              aria-current={isActive ? 'true' : undefined}
              className={cn(
                'focus-visible:ring-primary/50 group focus-visible:ring-offset-background relative flex w-full items-start gap-3 rounded-2xl border border-transparent p-3 text-left transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                isActive
                  ? 'border-primary/40 bg-primary/10'
                  : 'bg-background/70 hover:border-border/40 hover:bg-muted/40'
              )}
              role='listitem'
            >
              <div className='relative shrink-0'>
                <Avatar className='border-border/40 bg-background/80 text-foreground h-10 w-10 rounded-2xl border'>
                  <AvatarFallback className='bg-primary/15 text-primary rounded-2xl text-sm font-medium'>
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className='min-w-0 flex-1 space-y-1'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='min-w-0 flex-1'>
                    <p className='text-foreground truncate text-sm font-semibold'>{displayName}</p>
                  </div>
                  {lastMsg && (
                    <span className='text-muted-foreground shrink-0 text-[0.65rem]'>
                      {formatDistanceToNow(lastMsg.createdAt)}
                    </span>
                  )}
                </div>
                {lastMsg ? (
                  <p className='text-muted-foreground line-clamp-2 text-xs'>{lastMsg.message}</p>
                ) : (
                  <p className='text-muted-foreground text-xs'>Chưa có tin nhắn</p>
                )}
              </div>
              {room.unreadCount > 0 && (
                <span className='bg-primary text-primary-foreground ml-2 inline-flex min-h-[1.5rem] min-w-[1.5rem] items-center justify-center rounded-full text-[0.7rem] font-semibold shadow-lg'>
                  {room.unreadCount}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
