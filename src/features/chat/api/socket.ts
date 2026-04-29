import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from './types';

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socketInstance: ChatSocket | null = null;

/**
 * Get or create a Socket.IO connection to the /chat namespace.
 * Uses the JWT token from the cookie for authentication.
 * Reuses the same instance across the app (singleton).
 */
export function getChatSocket(token: string): ChatSocket {
  if (socketInstance?.connected) {
    return socketInstance;
  }

  // Disconnect stale instance if any
  if (socketInstance) {
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SOCKET_URL || process.env.API_URL || 'http://localhost:3001';

  socketInstance = io(`${baseUrl}/chat`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000
  });

  return socketInstance;
}

/**
 * Disconnect and clean up the socket instance.
 */
export function disconnectChatSocket(): void {
  if (socketInstance) {
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
  }
}

/**
 * Get the current socket instance without creating a new one.
 */
export function getCurrentChatSocket(): ChatSocket | null {
  return socketInstance;
}
