// frontend/src/components/Chat/ChatWindow.tsx
import React, { useCallback, useRef, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import { RootState } from '@/store';
import { useChat } from '@/hooks/useChat';

/**
 * Minimal drop-in ChatWindow component.
 * - Contains small internal MessageList, MessageInput and TypingIndicator to ensure drop-in behavior.
 * - Accessible: role=log, aria-live for new messages, keyboard accessible input, form semantics.
 *
 * NOTE: If you have full-featured MessageList/MessageInput components, replace internal subcomponents with imports.
 */

const MessageList: React.FC<{ messages: RootState['conversation']['messages'] }> = ({ messages }) => {
  return (
    <ul className="space-y-3">
      {messages.map((m) => (
        <li key={m.id} className="flex items-start gap-3" aria-label={`message from ${m.author}`}>
          <div className="flex-1">
            <div className="text-sm text-gray-500">{m.author}</div>
            <div className="mt-1 text-base text-gray-900 dark:text-gray-100">{m.content}</div>
            <div className="text-xs text-gray-400 mt-1">{new Date(m.createdAt).toLocaleString()}</div>
          </div>
        </li>
      ))}
    </ul>
  );
};

const TypingIndicator: React.FC<{ users: string[] }> = ({ users }) => {
  if (!users || users.length === 0) return null;
  const label = users.length === 1 ? `${users[0]} is typing…` : `${users.length} people are typing…`;
  return (
    <div className="py-1 px-2 text-sm text-gray-500" aria-live="polite" role="status">
      {label}
    </div>
  );
};

const MessageInput: React.FC<{ onSend: (content: string) => void; onTyping?: (isTyping: boolean) => void }> = ({
  onSend,
  onTyping,
}) => {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const submit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const el = inputRef.current;
      if (!el) return;
      const text = el.value.trim();
      if (!text) return;
      onSend(text);
      el.value = '';
      el.focus();
    },
    [onSend]
  );

  // small accessible textarea with keyboard send (Ctrl+Enter or Enter)
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submit();
      } else {
        onTyping?.(true);
      }
    },
    [submit, onTyping]
  );

  return (
    <form onSubmit={submit} className="flex items-end gap-3">
      <label htmlFor="chat-input" className="sr-only">
        Message
      </label>
      <textarea
        id="chat-input"
        ref={inputRef}
        onKeyDown={onKeyDown}
        rows={1}
        className="flex-1 resize-none rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
        placeholder="Type a message and press Enter to send"
        aria-label="Type a message"
      />
      <button
        type="submit"
        className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        aria-label="Send message"
      >
        Send
      </button>
    </form>
  );
};

const ChatWindow: React.FC = () => {
  const conversation = useAppSelector((s) => s.conversation);
  const dispatch = useAppDispatch();
  // token getter reads from localStorage; adapt if your auth library provides a function
  const tokenGetter = useCallback(() => {
    try {
      return localStorage.getItem('access_token');
    } catch {
      return null;
    }
  }, []);

  const { sendMessage, setTypingStatus, ready } = useChat(conversation.id, tokenGetter);
  const listRef = useRef<HTMLDivElement | null>(null);

  // scroll on new messages
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current;
    el.scrollTop = el.scrollHeight;
  }, [conversation.messages.length]);

  const handleSend = useCallback(
    (content: string) => {
      sendMessage(content);
    },
    [sendMessage]
  );

  const handleTyping = useCallback(
    (isTyping: boolean) => {
      // For demo purposes, we use a static user id; replace with real user id
      const userId = 'me';
      setTypingStatus(userId, isTyping);
    },
    [setTypingStatus]
  );

  return (
    <section
      aria-label="Chat window"
      className="flex h-full max-h-screen w-full flex-col bg-white dark:bg-gray-900 md:max-w-2xl md:mx-auto"
    >
      <header className="border-b bg-gray-50 px-4 py-3 dark:bg-gray-800">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Conversation</h2>
        <div className="text-xs text-gray-500">Status: {conversation.connected ? 'connected' : 'disconnected'}</div>
      </header>

      <div ref={listRef} role="log" aria-live="polite" className="flex-1 overflow-auto p-4">
        <MessageList messages={conversation.messages} />
      </div>

      <div className="px-4 pb-4">
        <TypingIndicator users={Object.keys(conversation.typingUsers).filter((u) => conversation.typingUsers[u])} />
        <MessageInput onSend={handleSend} onTyping={(isTyping) => handleTyping(isTyping)} />
        <div className="mt-2 text-xs text-gray-400">
          {ready ? 'Realtime enabled' : 'Realtime disabled'}
        </div>
      </div>
    </section>
  );
};

export default ChatWindow;
