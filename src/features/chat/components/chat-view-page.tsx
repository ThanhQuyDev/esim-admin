'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useChatStore } from '../utils/store';
import { ChatRoomList } from './chat-room-list';
import { ChatArea } from './chat-area';
import { ChatEmptyState } from './chat-empty-state';
import { ChatConnectionStatus } from './chat-connection-status';
import { ChatOrderWidget } from './chat-order-widget';
import { ChatDestinationSearch } from './chat-destination-search';

export default function ChatViewPage() {
  const connect = useChatStore((s) => s.connect);
  const clearSelection = useChatStore((s) => s.clearSelection);
  const fetchRooms = useChatStore((s) => s.fetchRooms);
  const connectionStatus = useChatStore((s) => s.connectionStatus);
  const selectedRoomId = useChatStore((s) => s.selectedRoomId);
  const openUserChat = useChatStore((s) => s.openUserChat);
  const didConnect = useRef(false);
  // ?userId=… opens that person's conversation (vande-2011 #021).
  const wantedUserId = Number(useSearchParams().get('userId')) || null;
  const openedFor = useRef<number | null>(null);

  useEffect(() => {
    if (didConnect.current) return;
    didConnect.current = true;

    // Fetch token + current user info in parallel
    Promise.all([
      fetch('/api/auth/token').then((res) => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json() as Promise<{ token: string }>;
      }),
      fetch('/api/auth/me').then((res) => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json() as Promise<{ id: number }>;
      })
    ])
      .then(([{ token }, me]) => {
        connect(token, me.id);
      })
      .catch(() => {
        // User not authenticated — connection status stays disconnected
      });

    return () => {
      // Leave the socket running: it is shared app-wide by
      // ChatNotificationListener. Disconnecting here killed the sidebar badge
      // and the desktop notifications the moment an admin left this page (#032).
      clearSelection();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch rooms once connected (admin view)
  useEffect(() => {
    if (connectionStatus === 'connected') {
      fetchRooms();
    }
  }, [connectionStatus, fetchRooms]);

  useEffect(() => {
    if (connectionStatus !== 'connected' || !wantedUserId) return;
    if (openedFor.current === wantedUserId) return;
    openedFor.current = wantedUserId;
    openUserChat(wantedUserId);
  }, [connectionStatus, wantedUserId, openUserChat]);

  return (
    <div className='flex min-h-0 flex-1 px-4 py-2 md:px-6'>
      <div className='border-border/50 bg-background/70 relative grid h-[calc(100dvh-5.5rem)] w-full grid-rows-[auto,1fr] gap-3 overflow-hidden rounded-2xl border p-3 backdrop-blur-xl sm:gap-4 sm:p-4 lg:[grid-template-columns:25%_1fr_20%] lg:grid-rows-[1fr] lg:gap-4 lg:rounded-3xl lg:p-5'>
        <ChatConnectionStatus />
        <ChatRoomList />
        {selectedRoomId ? <ChatArea /> : <ChatEmptyState />}
        {selectedRoomId && (
          <aside className='hidden space-y-3 overflow-y-auto lg:block'>
            {/* Search a destination and send its link into the chat (#050). */}
            <ChatDestinationSearch />
            <ChatOrderWidget />
          </aside>
        )}
      </div>
    </div>
  );
}
