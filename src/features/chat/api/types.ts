// ─── Server Data Types (from WebSocket spec) ────────────────────────────────

export interface ChatRoom {
  id: number;
  userId: number;
  createdAt: string; // ISO 8601
  updatedAt: string;
}

export interface ChatMessage {
  id: number;
  chatRoomId: number;
  senderId: number;
  message: string;
  isRead: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string;
}

export interface ChatRoomWithMeta extends ChatRoom {
  lastMessage: ChatMessage | null;
  unreadCount: number;
}

// ─── Client → Server Events ─────────────────────────────────────────────────

export interface ClientToServerEvents {
  joinRoom: (data: { userId?: number }) => void;
  sendMessage: (data: { chatRoomId: number; message: string }) => void;
  getMessages: (data: { chatRoomId: number; page?: number; limit?: number }) => void;
  markAsRead: (data: { chatRoomId: number }) => void;
  getRooms: () => void;
}

// ─── Server → Client Events ─────────────────────────────────────────────────

export interface ServerToClientEvents {
  joinedRoom: (data: { roomId: number; userId: number }) => void;
  newMessage: (data: ChatMessage) => void;
  messages: (data: { chatRoomId: number; messages: ChatMessage[] }) => void;
  markedAsRead: (data: { chatRoomId: number }) => void;
  rooms: (data: ChatRoomWithMeta[]) => void;
  error: (data: { message: string }) => void;
}

// ─── Connection Status ──────────────────────────────────────────────────────

export type SocketConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
