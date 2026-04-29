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

function getRoomInitials(room: ChatRoomWithMeta): string {
  return `U${room.userId}`;
}

function getRoomDisplayName(room: ChatRoomWithMeta): string {
  return `User #${room.userId}`;
}

export function ChatRoomList() {
  const rooms = useChatStore((s) => s.rooms);
  const selectedRoomId = useChatStore((s) => s.selectedRoomId);
  const selectRoom = useChatStore((s) => s.selectRoom);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return rooms;
    const q = search.toLowerCase();
    return rooms.filter((r) => getRoomDisplayName(r).toLowerCase().includes(q));
  }, [rooms, search]);

  return (
    <div className='border-border/40 bg-background/75 hidden h-full flex-col gap-4 overflow-hidden rounded-2xl border p-3 backdrop-blur lg:col-start-1 lg:col-end-2 lg:flex lg:rounded-3xl lg:p-4'>
      <div className='flex items-center justify-between gap-3'>
        <div>
          <p className='text-foreground text-sm font-semibold'>Messenger</p>
          <p className='text-muted-foreground text-xs'>
            {rooms.length} conversation{rooms.length === 1 ? '' : 's'}
          </p>
        </div>
        <Badge
          variant='outline'
          className='bg-primary/15 text-primary hover:bg-primary/15 hover:text-primary border-border/50 rounded-full border px-3 py-1 text-[0.7rem] tracking-[0.24em] uppercase'
        >
          Live
        </Badge>
      </div>

      <label htmlFor='messenger-search' className='sr-only'>
        Search conversations
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
          placeholder='Search conversations'
          className='border-border/40 bg-background/60 text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-primary/40 w-full rounded-2xl pl-10 text-sm focus-visible:ring-2'
        />
      </div>

      <div
        className='flex-1 space-y-2 overflow-y-auto pr-1'
        aria-label='Conversation list'
        role='list'
      >
        {filtered.length === 0 ? (
          <p className='text-muted-foreground py-8 text-center text-xs'>No conversations found</p>
        ) : null}
        {filtered.map((room) => {
          const isActive = room.id === selectedRoomId;
          const displayName = getRoomDisplayName(room);
          const initials = getRoomInitials(room);
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
                    <p className='text-foreground text-sm font-semibold'>{displayName}</p>
                    <p className='text-muted-foreground text-xs'>Room #{room.id}</p>
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
                  <p className='text-muted-foreground text-xs'>No messages yet</p>
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
