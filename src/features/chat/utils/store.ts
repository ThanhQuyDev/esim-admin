import { create } from 'zustand';
import type { ChatMessage, ChatRoomWithMeta, SocketConnectionStatus } from '../api/types';
import {
  getChatSocket,
  disconnectChatSocket,
  getCurrentChatSocket,
  type ChatSocket
} from '../api/socket';

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
  isLoadingMessages: boolean;
  error: string | null;

  // Actions
  connect: (token: string, myUserId: number) => void;
  disconnect: () => void;
  joinRoom: (userId?: number) => void;
  selectRoom: (roomId: number, userId: number) => void;
  sendMessage: (text: string) => void;
  loadMoreMessages: () => void;
  markAsRead: () => void;
  fetchRooms: () => void;
  setDraft: (text: string) => void;
  clearError: () => void;
  fetchUserInfo: (userId: number) => void;

  // Internal
  _socket: ChatSocket | null;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const MESSAGES_PER_PAGE = 50;

// ─── Store ──────────────────────────────────────────────────────────────────

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
  isLoadingMessages: false,
  error: null,
  _socket: null,

  connect: (token: string, myUserId: number) => {
    const existing = getCurrentChatSocket();
    if (existing?.connected) {
      set({ connectionStatus: 'connected', _socket: existing, myUserId });
      return;
    }

    set({ connectionStatus: 'connecting', myUserId });

    const socket = getChatSocket(token);

    // ── Connection events ──────────────────────────────────────────────
    socket.on('connect', () => {
      set({ connectionStatus: 'connected', _socket: socket });
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
        isLoadingMessages: true
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
          return {
            ...room,
            lastMessage: msg,
            unreadCount: msg.chatRoomId === s.selectedRoomId ? 0 : room.unreadCount + 1
          };
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
      draft: ''
    });

    socket.emit('joinRoom', { userId });
  },

  sendMessage: (text: string) => {
    const state = get();
    const socket = state._socket;
    if (!socket?.connected || !state.selectedRoomId) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    socket.emit('sendMessage', {
      chatRoomId: state.selectedRoomId,
      message: trimmed
    });

    set({ draft: '' });
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
  }
}));
