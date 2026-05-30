'use client';

import { useEffect, useRef } from 'react';
import { useChatStore } from '../utils/store';

export function ChatNotificationListener() {
  const connectionStatus = useChatStore((s) => s.connectionStatus);
  const connect = useChatStore((s) => s.connect);
  const didInit = useRef(false);

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
