'use client';

import { FormEvent, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useChatStore } from '../utils/store';
import { ChatRoomHeader } from './chat-room-header';
import { ChatMessageBubble } from './chat-message-bubble';
import { ChatComposer } from './chat-composer';
import { Spinner } from '@/components/ui/spinner';

export function ChatArea() {
  const messages = useChatStore((s) => s.messages);
  const selectedRoomId = useChatStore((s) => s.selectedRoomId);
  const isLoadingMessages = useChatStore((s) => s.isLoadingMessages);
  const hasMoreMessages = useChatStore((s) => s.hasMoreMessages);
  const draft = useChatStore((s) => s.draft);
  const setDraft = useChatStore((s) => s.setDraft);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const loadMoreMessages = useChatStore((s) => s.loadMoreMessages);
  const currentUserId = useChatStore((s) => s.currentUserId);

  const shouldReduceMotion = useReducedMotion();
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const liveRegionRef = useRef<HTMLDivElement | null>(null);
  const prevMessageCountRef = useRef(0);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!messagesContainerRef.current) return;
    const container = messagesContainerRef.current;

    // Only auto-scroll if new messages were added at the end (not prepended from pagination)
    if (messages.length > prevMessageCountRef.current) {
      const behavior = shouldReduceMotion ? 'auto' : 'smooth';
      const scrollToBottom = () => {
        container.scrollTo({ top: container.scrollHeight, behavior });
      };
      if (behavior === 'smooth') {
        requestAnimationFrame(scrollToBottom);
      } else {
        scrollToBottom();
      }
    }
    prevMessageCountRef.current = messages.length;
  }, [messages, shouldReduceMotion]);

  // Announce last message for screen readers
  useEffect(() => {
    if (!liveRegionRef.current || messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    liveRegionRef.current.textContent = `Sender ${lastMessage.senderId}: ${lastMessage.message}`;
  }, [messages]);

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!draft.trim()) return;
      sendMessage(draft);
    },
    [draft, sendMessage]
  );

  // Infinite scroll — load older messages when scrolling to top
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || isLoadingMessages || !hasMoreMessages) return;

    if (container.scrollTop < 100) {
      loadMoreMessages();
    }
  }, [isLoadingMessages, hasMoreMessages, loadMoreMessages]);

  if (!selectedRoomId) return null;

  return (
    <>
      <AnimatePresence initial={false} mode='wait'>
        <motion.div
          key={selectedRoomId}
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
          className='border-border/40 bg-background/80 flex min-h-0 flex-col gap-3 overflow-hidden rounded-2xl border p-3 backdrop-blur sm:gap-4 sm:p-4 lg:col-start-2 lg:col-end-3 lg:rounded-3xl'
        >
          <ChatRoomHeader />

          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className='[&::-webkit-scrollbar-thumb]:bg-muted relative min-h-0 flex-1 space-y-3 overflow-y-auto pr-2 sm:space-y-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full'
            aria-live='off'
            aria-label='Message thread'
          >
            {isLoadingMessages && messages.length === 0 && (
              <div className='flex items-center justify-center py-8'>
                <Spinner className='text-muted-foreground h-6 w-6' />
              </div>
            )}

            {hasMoreMessages && messages.length > 0 && (
              <div className='flex justify-center py-2'>
                <button
                  type='button'
                  onClick={loadMoreMessages}
                  disabled={isLoadingMessages}
                  className='text-muted-foreground hover:text-foreground text-xs transition disabled:opacity-50'
                >
                  {isLoadingMessages ? 'Loading...' : 'Load older messages'}
                </button>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <ChatMessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.senderId === currentUserId}
                />
              ))}
            </AnimatePresence>
          </div>

          <ChatComposer draft={draft} onDraftChange={setDraft} onSubmit={handleSubmit} />
        </motion.div>
      </AnimatePresence>
      <div ref={liveRegionRef} className='sr-only' aria-live='polite' aria-atomic='true' />
    </>
  );
}
