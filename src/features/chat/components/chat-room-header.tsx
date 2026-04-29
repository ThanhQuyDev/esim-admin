'use client';

import { Icons } from '@/components/icons';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useChatStore } from '../utils/store';

export function ChatRoomHeader() {
  const selectedRoomId = useChatStore((s) => s.selectedRoomId);
  const rooms = useChatStore((s) => s.rooms);
  const connectionStatus = useChatStore((s) => s.connectionStatus);

  const activeRoom = rooms.find((r) => r.id === selectedRoomId);
  const displayName = activeRoom ? `User #${activeRoom.userId}` : `Room #${selectedRoomId}`;
  const initials = activeRoom ? `U${activeRoom.userId}` : '?';

  return (
    <header className='flex flex-wrap items-center justify-between gap-3 sm:gap-4'>
      <div className='flex items-center gap-2 sm:gap-3'>
        <div className='relative'>
          <Avatar className='border-border/40 bg-card/80 text-foreground h-10 w-10 rounded-2xl border sm:h-12 sm:w-12 sm:rounded-3xl'>
            <AvatarFallback className='bg-primary/20 text-primary rounded-2xl text-sm font-semibold sm:rounded-3xl sm:text-base'>
              {initials}
            </AvatarFallback>
          </Avatar>
          <span
            className={`border-background absolute right-0 bottom-0 inline-flex h-3 w-3 rounded-full border-2 sm:h-3.5 sm:w-3.5 ${
              connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
            }`}
            aria-label={connectionStatus === 'connected' ? 'Online' : 'Offline'}
          />
        </div>
        <div>
          <p className='text-foreground text-sm font-semibold sm:text-base'>{displayName}</p>
          <p className='text-muted-foreground text-xs sm:text-sm'>
            {activeRoom ? `Room #${activeRoom.id}` : 'Chat'}
          </p>
        </div>
      </div>

      <div className='flex items-center gap-1.5 sm:gap-2'>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='border-border/40 bg-background/60 text-muted-foreground hover:bg-muted/60 focus-visible:ring-primary/40 focus-visible:ring-offset-background size-8 rounded-full border transition focus-visible:ring-2 focus-visible:ring-offset-2 sm:size-10'
          aria-label='Start audio call'
        >
          <Icons.phone className='h-3.5 w-3.5 sm:h-4 sm:w-4' />
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='border-border/40 bg-background/60 text-muted-foreground hover:bg-muted/60 focus-visible:ring-primary/40 focus-visible:ring-offset-background size-8 rounded-full border transition focus-visible:ring-2 focus-visible:ring-offset-2 sm:size-10'
          aria-label='Start video call'
        >
          <Icons.video className='h-3.5 w-3.5 sm:h-4 sm:w-4' />
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='border-border/40 bg-background/60 text-muted-foreground hover:bg-muted/60 focus-visible:ring-primary/40 focus-visible:ring-offset-background size-8 rounded-full border transition focus-visible:ring-2 focus-visible:ring-offset-2 sm:size-10'
          aria-label='Open conversation menu'
        >
          <Icons.ellipsis className='h-3.5 w-3.5 sm:h-4 sm:w-4' />
        </Button>
      </div>
    </header>
  );
}
