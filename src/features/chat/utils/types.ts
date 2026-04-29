// ─── UI Types (used by components) ──────────────────────────────────────────

export type Attachment = {
  id: string;
  name: string;
  size: number;
  type: string;
};

/**
 * @deprecated Use ChatMessage from api/types.ts for WebSocket data.
 * Kept for backward compatibility with MessageBubble component.
 */
export type Message = {
  id: string;
  sender: 'user' | 'contact';
  author: string;
  text: string;
  timestamp: string;
  attachments?: Attachment[];
};

export type ConversationStatus = 'online' | 'offline';

/**
 * @deprecated Use ChatRoomWithMeta from api/types.ts for WebSocket data.
 * Kept for backward compatibility with ConversationList/ConversationSelect.
 */
export type Conversation = {
  id: string;
  name: string;
  title: string;
  status: ConversationStatus;
  unread: number;
  initials: string;
  messages: Message[];
  quickReplies: string[];
  autoReplies: string[];
};
