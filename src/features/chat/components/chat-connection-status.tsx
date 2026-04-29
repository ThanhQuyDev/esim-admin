'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useChatStore } from '../utils/store';

const statusConfig = {
  connected: {
    label: 'Connected',
    className: 'bg-green-500/15 text-green-600 border-green-500/30'
  },
  connecting: {
    label: 'Connecting...',
    className: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30'
  },
  disconnected: {
    label: 'Disconnected',
    className: 'bg-red-500/15 text-red-600 border-red-500/30'
  },
  error: { label: 'Connection Error', className: 'bg-red-500/15 text-red-600 border-red-500/30' }
} as const;

export function ChatConnectionStatus() {
  const connectionStatus = useChatStore((s) => s.connectionStatus);
  const error = useChatStore((s) => s.error);

  // Don't show anything when connected
  if (connectionStatus === 'connected') return null;

  const config = statusConfig[connectionStatus];

  return (
    <div className='col-span-full flex items-center justify-center gap-2 py-1'>
      <Badge
        variant='outline'
        className={cn(
          'rounded-full border px-3 py-1 text-[0.7rem] tracking-wide',
          config.className
        )}
      >
        {config.label}
      </Badge>
      {error && <span className='text-muted-foreground text-xs'>{error}</span>}
    </div>
  );
}
