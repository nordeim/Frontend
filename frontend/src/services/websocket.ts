// frontend/src/services/websocket.ts
type ISODateString = string;

export type WSMessage =
  | {
      type: 'message';
      payload: {
        id: string;
        conversationId: string;
        author: string;
        content: string;
        createdAt: ISODateString;
      };
    }
  | {
      type: 'typing';
      payload: {
        conversationId: string;
        userId: string;
        isTyping: boolean;
      };
    }
  | {
      type: 'presence';
      payload: {
        conversationId: string;
        userId: string;
        status: 'online' | 'offline' | 'away';
      };
    }
  | {
      type: 'error';
      payload: {
        message: string;
        code?: string;
      };
    };

type OnMessage = (msg: WSMessage) => void;
type OnOpen = () => void;
type OnClose = (evt?: CloseEvent) => void;
type OnError = (err?: Event) => void;
type TokenGetter = () => string | null | undefined;

/**
 * WebSocketManager - small robust wrapper for browser WebSocket
 * - reconnects with exponential backoff and jitter
 * - simple subscribe/unsubscribe
 * - supports token getter to attach auth token as query parameter
 */
export class WebSocketManager {
  private url: string;
  private tokenGetter?: TokenGetter;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private shouldReconnect = true;
  private forcedClose = false;

  private onMessageHandler?: OnMessage;
  private onOpenHandler?: OnOpen;
  private onCloseHandler?: OnClose;
  private onErrorHandler?: OnError;

  constructor(url: string, tokenGetter?: TokenGetter) {
    this.url = url;
    this.tokenGetter = tokenGetter;
  }

  private buildUrl(): string {
    const base = this.url;
    const token = this.tokenGetter?.();
    if (!token) return base;
    // Attach token as query param by default; backend may accept header-based auth via WS subprotocols.
    try {
      const connector = base.includes('?') ? '&' : '?';
      return `${base}${connector}token=${encodeURIComponent(token)}`;
    } catch {
      return base;
    }
  }

  connect(): void {
    if (this.ws) return;
    const fullUrl = this.buildUrl();
    try {
      this.ws = new WebSocket(fullUrl);
      this.forceReconnect(false);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.onOpenHandler?.();
      };

      this.ws.onmessage = (evt: MessageEvent<string>) => {
        try {
          const parsed = JSON.parse(evt.data) as WSMessage;
          this.onMessageHandler?.(parsed);
        } catch (err) {
          // Ignore invalid message format but notify via error handler
          this.onErrorHandler?.(new Event('error'));
          console.error('WS invalid JSON', err);
        }
      };

      this.ws.onclose = (evt: CloseEvent) => {
        this.ws = null;
        this.onCloseHandler?.(evt);
        if (this.shouldReconnect && !this.forcedClose) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (evt: Event) => {
        this.onErrorHandler?.(evt);
        // allow onclose to decide reconnection
      };
    } catch (err) {
      this.ws = null;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts += 1;
    const maxDelay = 30000;
    const base = Math.min(1000 * 2 ** (this.reconnectAttempts - 1), maxDelay);
    // jitter: ±20%
    const jitter = base * 0.2 * (Math.random() - 0.5);
    const delay = Math.max(500, Math.round(base + jitter));
    setTimeout(() => this.connect(), delay);
  }

  send(obj: unknown): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }
    try {
      this.ws.send(JSON.stringify(obj));
    } catch (err) {
      console.error('WS send error', err);
    }
  }

  disconnect(force = false): void {
    this.shouldReconnect = !force;
    this.forcedClose = !!force;
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      } finally {
        this.ws = null;
      }
    }
  }

  // listeners
  onMessage(fn: OnMessage): void {
    this.onMessageHandler = fn;
  }
  onOpen(fn: OnOpen): void {
    this.onOpenHandler = fn;
  }
  onClose(fn: OnClose): void {
    this.onCloseHandler = fn;
  }
  onError(fn: OnError): void {
    this.onErrorHandler = fn;
  }

  private forceReconnect(v: boolean): void {
    this.shouldReconnect = v;
  }
}
