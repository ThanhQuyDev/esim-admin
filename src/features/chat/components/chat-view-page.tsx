'use client';

import { useEffect, useRef } from 'react';
import { useChatStore } from '../utils/store';
import { ChatRoomList } from './chat-room-list';
import { ChatArea } from './chat-area';
import { ChatEmptyState } from './chat-empty-state';
import { ChatConnectionStatus } from './chat-connection-status';

export default function ChatViewPage() {
  const connect = useChatStore((s) => s.connect);
  const disconnect = useChatStore((s) => s.disconnect);
  const fetchRooms = useChatStore((s) => s.fetchRooms);
  const connectionStatus = useChatStore((s) => s.connectionStatus);
  const selectedRoomId = useChatStore((s) => s.selectedRoomId);
  const didConnect = useRef(false);

  useEffect(() => {
    if (didConnect.current) return;
    didConnect.current = true;

    // Token cookie is httpOnly — fetch it via API route
    fetch('/api/auth/token')
      .then((res) => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then(({ token }: { token: string }) => {
        connect(token);
      })
      .catch(() => {
        // User not authenticated — connection status stays disconnected
      });

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch rooms once connected (admin view)
  useEffect(() => {
    if (connectionStatus === 'connected') {
      fetchRooms();
    }
  }, [connectionStatus, fetchRooms]);

  return (
    <div className='flex min-h-0 flex-1 px-4 py-2 md:px-6'>
      <div className='border-border/50 bg-background/70 relative grid h-[calc(100dvh-5.5rem)] w-full grid-rows-[auto,1fr] gap-3 overflow-hidden rounded-2xl border p-3 backdrop-blur-xl sm:gap-4 sm:p-4 lg:[grid-template-columns:30%_1fr] lg:grid-rows-[1fr] lg:gap-4 lg:rounded-3xl lg:p-5'>
        <ChatConnectionStatus />
        <ChatRoomList />
        {selectedRoomId ? <ChatArea /> : <ChatEmptyState />}
      </div>
    </div>
  );
}
