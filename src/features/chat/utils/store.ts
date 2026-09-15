import { create } from 'zustand';
import type { ChatMessage, ChatRoomWithMeta, SocketConnectionStatus } from '../api/types';
import {
  getChatSocket,
  disconnectChatSocket,
  getCurrentChatSocket,
  type ChatSocket
} from '../api/socket';

// File attachment metadata for the sendMessage event payload
export interface ChatFileAttachment {
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

// ─── Store Types ────────────────────────────────────────────────────────────

interface UserInfo {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

interface ChatState {
  // Connection
  connectionStatus: SocketConnectionStatus;
  myUserId: number | null; // The logged-in user's (admin's) own ID
  roomOwnerId: number | null; // The user who owns the current room

  // User info cache (userId → UserInfo)
  userCache: Record<number, UserInfo>;

  // Rooms (admin view)
  rooms: ChatRoomWithMeta[];
  selectedRoomId: number | null;

  // Messages for the active room
  messages: ChatMessage[];
  messagesPage: number;
  hasMoreMessages: boolean;

  // UI
  draft: string;
  /** The message the admin is quoting, if any (#073). */
  replyTo: ChatMessage | null;
  isLoadingMessages: boolean;
  error: string | null;

  // Sound notification
  soundEnabled: boolean;

  /** Desktop (browser) notifications — the sound alone is easy to miss (#070). */
  desktopNotifyEnabled: boolean;

  // Actions
  connect: (token: string, myUserId: number) => void;
  disconnect: () => void;
  joinRoom: (userId?: number) => void;
  selectRoom: (roomId: number, userId: number) => void;
  clearSelection: () => void;
  sendMessage: (text: string, file?: ChatFileAttachment) => void;
  /**
   * Send a ready-made message (e.g. a destination link, #050) without touching
   * what the admin is typing or the message they are replying to.
   */
  sendQuickMessage: (text: string) => boolean;
  loadMoreMessages: () => void;
  markAsRead: () => void;
  fetchRooms: () => void;
  setDraft: (text: string) => void;
  setReplyTo: (message: ChatMessage | null) => void;
  clearError: () => void;
  fetchUserInfo: (userId: number) => void;
  toggleSound: () => void;
  toggleDesktopNotify: () => void;

  // Internal
  _socket: ChatSocket | null;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const MESSAGES_PER_PAGE = 50;

// ─── Store ──────────────────────────────────────────────────────────────────

/**
 * Ask the browser for permission to show notifications (#070).
 *
 * Admins reported missing chats because the notification sound is easy to miss
 * — or muted entirely — so a desktop notification is the reliable signal.
 */
export async function requestDesktopPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    return (await Notification.requestPermission()) === 'granted';
  } catch {
    return false;
  }
}

/**
 * Show a desktop notification for a customer message.
 *
 * Skipped when the admin is already looking at that conversation — a
 * notification for the message on screen is noise.
 */
function notifyDesktop(title: string, body: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    const notification = new Notification(title, {
      body,
      icon: '/app/logo.png',
      // One notification per conversation: a burst of messages replaces the
      // previous card instead of stacking up.
      tag: 'esim-chat'
    });
    notification.onclick = () => {
      window.focus();
      window.location.href = '/dashboard/chat';
      notification.close();
    };
  } catch {
    // Notifications unavailable — the badge in the sidebar still shows the count.
  }
}

export const useChatStore = create<ChatState>()((set, get) => ({
  // Initial state
  connectionStatus: 'disconnected',
  myUserId: null,
  roomOwnerId: null,
  userCache: {},
  rooms: [],
  selectedRoomId: null,
  messages: [],
  messagesPage: 1,
  hasMoreMessages: true,
  draft: '',
  replyTo: null,
  isLoadingMessages: false,
  error: null,
  soundEnabled: (() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('chat_sound_enabled');
    return stored !== null ? stored === 'true' : true;
  })(),
  desktopNotifyEnabled: (() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('chat_desktop_notify');
    return stored !== null ? stored === 'true' : true;
  })(),
  _socket: null,

  connect: (token: string, myUserId: number) => {
    const existing = getCurrentChatSocket();
    if (existing?.connected) {
      set({ connectionStatus: 'connected', _socket: existing, myUserId });
      existing.emit('getRooms');
      return;
    }

    set({ connectionStatus: 'connecting', myUserId });

    const socket = getChatSocket(token);

    // ── Connection events ──────────────────────────────────────────────
    socket.on('connect', () => {
      set({ connectionStatus: 'connected', _socket: socket });
      // Subscribe to all rooms for global notifications
      socket.emit('subscribeAllRooms');
      // …and load them: the sidebar badge counts waiting rooms, and outside
      // the chat page nothing else ever fetched the list, so it read 0 (#032).
      socket.emit('getRooms');
    });

    socket.on('disconnect', () => {
      set({ connectionStatus: 'disconnected' });
    });

    socket.on('connect_error', () => {
      set({ connectionStatus: 'error', error: 'Connection failed' });
    });

    // ── Business events ────────────────────────────────────────────────
    socket.on('joinedRoom', ({ roomId, userId }) => {
      set({
        selectedRoomId: roomId,
        roomOwnerId: userId,
        messages: [],
        messagesPage: 1,
        hasMoreMessages: true,
        isLoadingMessages: true,
        replyTo: null
      });

      // Fetch user info for the room owner
      get().fetchUserInfo(userId);

      // Load initial messages
      socket.emit('getMessages', {
        chatRoomId: roomId,
        page: 1,
        limit: MESSAGES_PER_PAGE
      });
    });

    socket.on('messages', ({ chatRoomId, messages: incoming }) => {
      const state = get();
      if (chatRoomId !== state.selectedRoomId) return;

      // Messages come DESC (newest first) — reverse for chronological display
      const chronological = [...incoming].reverse();

      // Fetch user info for any unknown senders
      const unknownSenders = new Set<number>();
      for (const msg of chronological) {
        if (!state.userCache[msg.senderId]) {
          unknownSenders.add(msg.senderId);
        }
      }
      for (const senderId of unknownSenders) {
        get().fetchUserInfo(senderId);
      }

      if (state.messagesPage === 1) {
        // Initial load — replace
        set({
          messages: chronological,
          isLoadingMessages: false,
          hasMoreMessages: incoming.length >= MESSAGES_PER_PAGE
        });
      } else {
        // Pagination — prepend older messages
        set({
          messages: [...chronological, ...state.messages],
          isLoadingMessages: false,
          hasMoreMessages: incoming.length >= MESSAGES_PER_PAGE
        });
      }
    });

    socket.on('newMessage', (msg) => {
      const state = get();

      // Fetch user info if unknown sender
      if (!state.userCache[msg.senderId]) {
        get().fetchUserInfo(msg.senderId);
      }

      // A customer is the room's owner. Bot messages (no sender) and other
      // admins' replies are not someone waiting for an answer (#032).
      const room = state.rooms.find((r) => r.id === msg.chatRoomId);
      const fromCustomer = room
        ? msg.senderId === room.userId
        : msg.senderId !== null && msg.senderId !== state.myUserId;

      // A conversation we have not loaded yet: fetch the list so it shows.
      if (!room) socket.emit('getRooms');

      // Play notification sound if enabled and message is from customer
      if (state.soundEnabled && fromCustomer) {
        try {
          const audio = new Audio('/app/sound/notification.mp3');
          audio.volume = 0.5;
          audio.play().catch(() => {});
        } catch {
          // Audio playback not available
        }
      }

      // A desktop notification too: the sound is easy to miss, and admins were
      // not noticing waiting customers at all (#070). Not for the conversation
      // already open on screen.
      const isViewing =
        msg.chatRoomId === state.selectedRoomId &&
        typeof document !== 'undefined' &&
        document.visibilityState === 'visible';
      if (state.desktopNotifyEnabled && fromCustomer && !isViewing) {
        const sender = state.userCache[msg.senderId];
        const fallbackName = `Khách #${msg.senderId}`;
        const name = sender
          ? [sender.firstName, sender.lastName].filter(Boolean).join(' ') ||
            sender.email ||
            fallbackName
          : fallbackName;
        notifyDesktop(
          `Tin nhắn mới từ ${name}`,
          msg.message?.slice(0, 120) || 'Đã gửi một tệp đính kèm'
        );
      }

      // Append to current chat if it's the active room
      if (msg.chatRoomId === state.selectedRoomId) {
        set({ messages: [...state.messages, msg] });
        // Auto mark as read since user is viewing this room
        socket.emit('markAsRead', { chatRoomId: msg.chatRoomId });
      }

      // Update room list (for admin sidebar)
      set((s) => ({
        rooms: s.rooms.map((room) => {
          if (room.id !== msg.chatRoomId) return room;
          const unreadCount =
            msg.chatRoomId === s.selectedRoomId
              ? 0
              : msg.senderId === room.userId
                ? room.unreadCount + 1
                : room.unreadCount;
          return { ...room, lastMessage: msg, unreadCount };
        })
      }));
    });

    socket.on('markedAsRead', ({ chatRoomId }) => {
      set((s) => ({
        rooms: s.rooms.map((room) => (room.id === chatRoomId ? { ...room, unreadCount: 0 } : room)),
        messages: s.messages.map((msg) =>
          msg.chatRoomId === chatRoomId ? { ...msg, isRead: true } : msg
        )
      }));
    });

    socket.on('roomsChanged', () => {
      socket.emit('getRooms');
    });

    socket.on('rooms', (rooms) => {
      set({ rooms });

      // Fetch user info for all room owners
      const state = get();
      for (const room of rooms) {
        if (!state.userCache[room.userId]) {
          get().fetchUserInfo(room.userId);
        }
      }
    });

    socket.on('error', ({ message }) => {
      set({ error: message, isLoadingMessages: false });
    });

    // Connect if not already
    if (!socket.connected) {
      socket.connect();
    }

    set({ _socket: socket });
  },

  disconnect: () => {
    disconnectChatSocket();
    set({
      connectionStatus: 'disconnected',
      _socket: null,
      rooms: [],
      selectedRoomId: null,
      roomOwnerId: null,
      messages: [],
      messagesPage: 1,
      draft: '',
      replyTo: null,
      error: null
    });
  },

  joinRoom: (userId?: number) => {
    const socket = get()._socket;
    if (!socket?.connected) return;
    socket.emit('joinRoom', { userId });
  },

  selectRoom: (roomId: number, userId: number) => {
    const socket = get()._socket;
    if (!socket?.connected) return;

    set({
      selectedRoomId: roomId,
      roomOwnerId: userId,
      messages: [],
      messagesPage: 1,
      hasMoreMessages: true,
      isLoadingMessages: true,
      draft: '',
      replyTo: null
    });

    socket.emit('joinRoom', { userId });
  },

  clearSelection: () => {
    set({
      selectedRoomId: null,
      roomOwnerId: null,
      messages: [],
      messagesPage: 1,
      hasMoreMessages: true,
      isLoadingMessages: false,
      draft: '',
      replyTo: null
    });
  },

  sendMessage: (text: string, file?: ChatFileAttachment) => {
    const state = get();
    const socket = state._socket;
    if (!socket?.connected || !state.selectedRoomId) return;

    const trimmed = text.trim();
    if (!trimmed && !file) return;

    socket.emit('sendMessage', {
      chatRoomId: state.selectedRoomId,
      message: trimmed || (file ? '📎' : ''),
      ...(file && {
        fileUrl: file.fileUrl,
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize
      }),
      // The quote is consumed by this one message, like every messenger (#073)
      ...(state.replyTo && { replyToId: state.replyTo.id })
    });

    set({ draft: '', replyTo: null });
  },

  sendQuickMessage: (text: string) => {
    const state = get();
    const socket = state._socket;
    const trimmed = text.trim();
    if (!socket?.connected || !state.selectedRoomId || !trimmed) return false;

    socket.emit('sendMessage', {
      chatRoomId: state.selectedRoomId,
      message: trimmed
    });
    return true;
  },

  loadMoreMessages: () => {
    const state = get();
    const socket = state._socket;
    if (
      !socket?.connected ||
      !state.selectedRoomId ||
      state.isLoadingMessages ||
      !state.hasMoreMessages
    ) {
      return;
    }

    const nextPage = state.messagesPage + 1;
    set({ messagesPage: nextPage, isLoadingMessages: true });

    socket.emit('getMessages', {
      chatRoomId: state.selectedRoomId,
      page: nextPage,
      limit: MESSAGES_PER_PAGE
    });
  },

  markAsRead: () => {
    const state = get();
    const socket = state._socket;
    if (!socket?.connected || !state.selectedRoomId) return;

    socket.emit('markAsRead', { chatRoomId: state.selectedRoomId });
  },

  fetchRooms: () => {
    const socket = get()._socket;
    if (!socket?.connected) return;
    socket.emit('getRooms');
  },

  setDraft: (text: string) => set({ draft: text }),

  setReplyTo: (message: ChatMessage | null) => set({ replyTo: message }),

  clearError: () => set({ error: null }),

  fetchUserInfo: (userId: number) => {
    const state = get();
    // Skip if already cached or if it's the current admin user
    if (state.userCache[userId]) return;

    fetch(`/api/users/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch user');
        return res.json();
      })
      .then((user: UserInfo) => {
        set((s) => ({
          userCache: {
            ...s.userCache,
            [user.id]: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName
            }
          }
        }));
      })
      .catch(() => {
        // Silently fail — display will fall back to "User #id"
      });
  },

  toggleSound: () =>
    set((s) => {
      const next = !s.soundEnabled;
      if (typeof window !== 'undefined') {
        localStorage.setItem('chat_sound_enabled', String(next));
      }
      return { soundEnabled: next };
    }),

  toggleDesktopNotify: () =>
    set((s) => {
      const next = !s.desktopNotifyEnabled;
      if (typeof window !== 'undefined') {
        localStorage.setItem('chat_desktop_notify', String(next));
        // Asking only when it is switched ON keeps the browser prompt tied to a
        // deliberate click, which is what browsers expect.
        if (next) void requestDesktopPermission();
      }
      return { desktopNotifyEnabled: next };
    })
}));
