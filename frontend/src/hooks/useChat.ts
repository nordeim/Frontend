// frontend/src/hooks/useChat.ts
import { useEffect, useRef, useCallback } from 'react';
import { WebSocketManager, WSMessage } from '@/services/websocket';
import { api } from '@/services/api';
import { store } from '@/store';
import {
  addMessage,
  setConnected,
  setConversationId,
  setTyping,
  createConversation,
  sendMessageAsync,
} from '@/store/slices/conversationSlice';

type TokenGetter = () => string | null;

/**
 * useChat - hook that ties together Redux conversation slice, API client and WebSocket manager.
 *
 * Usage:
 *  const { sendMessage, connected } = useChat(conversationId, tokenGetter);
 *
 * Responsibilities:
 *  - Connect/disconnect to WS when conversationId changes
 *  - Dispatch incoming messages to Redux
 *  - Provide sendMessage method that ensures conversation exists (via API create) and posts messages
 */
export function useChat(conversationId: string | null | undefined, tokenGetter?: TokenGetter) {
  const wsRef = useRef<WebSocketManager | null>(null);
  const currentConvRef = useRef<string | null | undefined>(conversationId ?? null);
  const typingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    currentConvRef.current = conversationId ?? null;
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) {
      // nothing to connect
      return;
    }
    // create a manager per conversation for isolation
    const wsUrl = (import.meta.env.VITE_WS_URL as string) ?? 'ws://localhost:8000/ws';
    const manager = new WebSocketManager(wsUrl, tokenGetter);
    wsRef.current = manager;

    manager.onOpen(() => {
      store.dispatch(setConnected(true));
    });

    manager.onClose(() => {
      store.dispatch(setConnected(false));
    });

    manager.onError(() => {
      store.dispatch(setConnected(false));
    });

    manager.onMessage((msg: WSMessage) => {
      if (msg.type === 'message') {
        store.dispatch(
          addMessage({
            id: msg.payload.id,
            conversationId: msg.payload.conversationId,
            author: msg.payload.author,
            content: msg.payload.content,
            createdAt: msg.payload.createdAt,
          })
        );
      } else if (msg.type === 'typing') {
        store.dispatch(setTyping({ userId: msg.payload.userId, isTyping: msg.payload.isTyping }));
      }
    });

    manager.connect();

    return () => {
      manager.disconnect(true);
      wsRef.current = null;
    };
    // note: tokenGetter is intentionally not in deps to avoid reconnect loops from function identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // send message using REST (server will broadcast via WS)
  const sendMessage = useCallback(
    async (content: string) => {
      try {
        let convId = conversationId;
        if (!convId) {
          // create conversation via redux thunk so state stays consistent
          const res = await store.dispatch<any>(createConversation({ userId: null })).unwrap();
          convId = res.id;
          store.dispatch(setConversationId(convId));
        }
        // optimistic dispatch? we rely on server message delivered via WS or response from REST send
        // use thunk to persist and push to state when finished
        await store.dispatch<any>(sendMessageAsync({ conversationId: convId!, content })).unwrap();
        return true;
      } catch (err) {
        console.error('sendMessage error', err);
        return false;
      }
    },
    [conversationId]
  );

  const setTypingStatus = useCallback(
    (userId: string, isTyping: boolean) => {
      // local update
      store.dispatch(setTyping({ userId, isTyping }));
      // debounce to reduce network chatter
      if (typingTimerRef.current) {
        window.clearTimeout(typingTimerRef.current);
      }
      typingTimerRef.current = window.setTimeout(() => {
        // send typing event over WS if connected
        const manager = wsRef.current;
        if (manager) {
          manager.send({
            type: 'typing',
            payload: { conversationId, userId, isTyping },
          });
        }
      }, 200);
    },
    [conversationId]
  );

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        window.clearTimeout(typingTimerRef.current);
      }
    };
  }, []);

  const ready = Boolean(wsRef.current);

  return { sendMessage, setTypingStatus, ready };
}
