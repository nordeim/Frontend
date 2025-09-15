// frontend/src/services/api.ts
import axios, { AxiosInstance, AxiosError } from 'axios';

export type TokenGetter = () => string | null | undefined;

export interface ApiConfig {
  baseURL?: string;
  tokenGetter?: TokenGetter;
  timeoutMs?: number;
}

export class ApiError extends Error {
  status?: number;
  data?: unknown;
  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Generic typed API client wrapper around axios.
 * - Use `api` singleton for simple usage.
 * - Pass a tokenGetter if you need authorization headers.
 */
export class ApiClient {
  private axios: AxiosInstance;
  private tokenGetter?: TokenGetter;

  constructor(config?: ApiConfig) {
    const baseURL = config?.baseURL ?? (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:8000/api/v1';
    const timeoutMs = config?.timeoutMs ?? 10000;
    this.tokenGetter = config?.tokenGetter;

    this.axios = axios.create({
      baseURL,
      timeout: timeoutMs,
      headers: { 'Content-Type': 'application/json' },
    });

    // Attach token to each request if available
    this.axios.interceptors.request.use((req) => {
      const token = this.tokenGetter?.();
      if (token) {
        req.headers = { ...(req.headers ?? {}), Authorization: `Bearer ${token}` };
      }
      return req;
    });
  }

  private handleAxiosError(err: unknown): never {
    if (err && (err as AxiosError).isAxiosError) {
      const aerr = err as AxiosError;
      const status = aerr.response?.status;
      const data = aerr.response?.data;
      throw new ApiError(aerr.message, status, data);
    }
    throw new ApiError(String(err));
  }

  async get<T = unknown>(path: string, params?: Record<string, unknown>): Promise<T> {
    try {
      const res = await this.axios.get<T>(path, { params });
      return res.data;
    } catch (err) {
      this.handleAxiosError(err);
    }
  }

  async post<T = unknown, B = unknown>(path: string, body?: B): Promise<T> {
    try {
      const res = await this.axios.post<T>(path, body);
      return res.data;
    } catch (err) {
      this.handleAxiosError(err);
    }
  }

  async put<T = unknown, B = unknown>(path: string, body?: B): Promise<T> {
    try {
      const res = await this.axios.put<T>(path, body);
      return res.data;
    } catch (err) {
      this.handleAxiosError(err);
    }
  }

  async delete<T = unknown>(path: string): Promise<T> {
    try {
      const res = await this.axios.delete<T>(path);
      return res.data;
    } catch (err) {
      this.handleAxiosError(err);
    }
  }

  // Domain helpers (typed minimal)
  async createConversation(userId?: string | null): Promise<{ id: string }> {
    return this.post<{ id: string }, { userId?: string | null }>('/conversations', { userId });
  }

  async sendMessage(conversationId: string, content: string): Promise<{
    id: string;
    conversationId: string;
    author: string;
    content: string;
    createdAt: string;
  }> {
    return this.post('/conversations/' + encodeURIComponent(conversationId) + '/messages', { content });
  }
}

/**
 * Default singleton instance used across the app.
 * If you need to override token getter (for SSR or special auth flows), create your own ApiClient.
 */
export const api = new ApiClient({
  baseURL: (import.meta.env.VITE_API_URL as string) ?? undefined,
  tokenGetter: () => {
    try {
      return localStorage.getItem('access_token');
    } catch {
      return null;
    }
  },
});
