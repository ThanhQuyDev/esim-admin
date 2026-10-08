'use client';

import { useEffect, useRef } from 'react';
import { requestDesktopPermission, useChatStore } from '../utils/store';

const TITLE_PREFIX = /^\(\d+\+?\) /;

/**
 * "(3) Quản trị esim.vn" in the browser tab while customers wait for a reply,
 * as the storefront already does (v3 #012) — visible from any other tab.
 *
 * Next.js rewrites the title on every navigation, so the prefix is re-applied
 * whenever the <title> changes rather than set once.
 */
function useWaitingCountInTitle(waiting: number) {
  useEffect(() => {
    const apply = () => {
      const base = document.title.replace(TITLE_PREFIX, '');
      const next = waiting > 0 ? `(${waiting > 99 ? '99+' : waiting}) ${base}` : base;
      if (document.title !== next) document.title = next;
    };
    apply();

    const observer = new MutationObserver(apply);
    observer.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => {
      observer.disconnect();
      document.title = document.title.replace(TITLE_PREFIX, '');
    };
  }, [waiting]);
}

export function ChatNotificationListener() {
  const waitingRooms = useChatStore((s) => s.rooms.filter((room) => room.unreadCount > 0).length);
  useWaitingCountInTitle(waitingRooms);
  const connectionStatus = useChatStore((s) => s.connectionStatus);
  const connect = useChatStore((s) => s.connect);
  const desktopNotifyEnabled = useChatStore((s) => s.desktopNotifyEnabled);
  const didInit = useRef(false);

  // Ask once, quietly: a browser that refuses without a click simply leaves the
  // sidebar badge as the signal, and the toggle in the chat header asks again
  // from a real click (#070).
  useEffect(() => {
    if (desktopNotifyEnabled) void requestDesktopPermission();
  }, [desktopNotifyEnabled]);

  useEffect(() => {
    if (didInit.current) return;
    if (connectionStatus === 'connected' || connectionStatus === 'connecting') return;
    didInit.current = true;

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
        didInit.current = false;
      });
  }, [connectionStatus, connect]);

  return null;
}
