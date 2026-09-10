// ─── Server Data Types (from WebSocket spec) ────────────────────────────────

export interface ChatRoom {
  id: number;
  userId: number;
  createdAt: string; // ISO 8601
  updatedAt: string;
}

/** The snippet the server sends along with a reply, to draw the quote (#073). */
export interface ChatMessageQuote {
  id: number;
  senderId: number | null;
  message: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
}

export interface ChatMessage {
  id: number;
  chatRoomId: number;
  senderId: number;
  message: string;
  isRead: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string;
  // Optional file attachment (image/* or video/*) uploaded via Cloudinary
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  // Set when this message quotes an earlier one in the same room (#073)
  replyToId?: number | null;
  replyTo?: ChatMessageQuote | null;
}

export interface ChatRoomWithMeta extends ChatRoom {
  lastMessage: ChatMessage | null;
  unreadCount: number;
}

// ─── Client → Server Events ─────────────────────────────────────────────────

export interface SendMessagePayload {
  chatRoomId: number;
  message: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  replyToId?: number;
}

export interface ClientToServerEvents {
  joinRoom: (data: { userId?: number }) => void;
  sendMessage: (data: SendMessagePayload) => void;
  getMessages: (data: { chatRoomId: number; page?: number; limit?: number }) => void;
  markAsRead: (data: { chatRoomId: number }) => void;
  getRooms: () => void;
  subscribeAllRooms: () => void;
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
