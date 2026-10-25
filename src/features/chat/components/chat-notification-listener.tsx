'use client';

import { useEffect, useRef } from 'react';
import { requestDesktopPermission, useChatStore } from '../utils/store';

const TITLE_PREFIX = /^\(\d+\+?\) /;
const ALERT_TITLE = 'Tin nhắn mới...';
const FLASH_MS = 1500;

/**
 * The browser tab while customers wait for a reply: "(3) Quản trị esim.vn"
 * (v3 #012), and — while the tab is in the background — alternating with
 * "(3) Tin nhắn mới..." every 1.5 s, the way the storefront tab flashes for
 * the customer (vande #044). Back on the tab, the plain count stays.
 *
 * Next.js rewrites the title on every navigation, so the page's own title is
 * picked up whenever the <title> changes to something this hook did not write.
 */
function useWaitingCountInTitle(waiting: number) {
  const base = useRef('');
  const written = useRef('');
  const alertPhase = useRef(false);

  useEffect(() => {
    const count = waiting > 99 ? '99+' : String(waiting);
    const apply = () => {
      if (document.title !== written.current) {
        base.current = document.title.replace(TITLE_PREFIX, '');
      }
      const next =
        waiting > 0
          ? `(${count}) ${alertPhase.current ? ALERT_TITLE : base.current}`
          : base.current;
      written.current = next;
      if (document.title !== next) document.title = next;
    };
    apply();

    const observer = new MutationObserver(apply);
    observer.observe(document.head, { subtree: true, childList: true, characterData: true });

    const timer = window.setInterval(() => {
      // Flash only in the background, as on the storefront.
      const flash = waiting > 0 && document.hidden;
      if (!flash && !alertPhase.current) return;
      alertPhase.current = flash ? !alertPhase.current : false;
      apply();
    }, FLASH_MS);
    const onVisibility = () => {
      if (!document.hidden && alertPhase.current) {
        alertPhase.current = false;
        apply();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      observer.disconnect();
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      alertPhase.current = false;
      document.title = base.current || document.title.replace(TITLE_PREFIX, '');
      written.current = document.title;
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
