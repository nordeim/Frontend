// frontend/src/store/slices/conversationSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/services/api';

export interface Message {
  id: string;
  conversationId: string;
  author: string;
  content: string;
  createdAt: string; // ISO
}

export interface ConversationState {
  id: string | null;
  messages: Message[];
  connected: boolean;
  typingUsers: Record<string, boolean>;
  loading: boolean;
  error?: string | null;
}

const initialState: ConversationState = {
  id: null,
  messages: [],
  connected: false,
  typingUsers: {},
  loading: false,
  error: null,
};

// Async thunks
export const createConversation = createAsyncThunk(
  'conversation/createConversation',
  async (payload: { userId?: string | null } | undefined, { rejectWithValue }) => {
    try {
      const res = await api.createConversation(payload?.userId ?? null);
      return res; // { id }
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message ?? 'createConversation failed');
    }
  }
);

export const sendMessageAsync = createAsyncThunk(
  'conversation/sendMessage',
  async (payload: { conversationId: string; content: string }, { rejectWithValue }) => {
    try {
      const msg = await api.sendMessage(payload.conversationId, payload.content);
      return msg;
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message ?? 'sendMessage failed');
    }
  }
);

const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    setConversationId(state, action: PayloadAction<string>) {
      state.id = action.payload;
    },
    addMessage(state, action: PayloadAction<Message>) {
      // prevent duplicates by id
      const exists = state.messages.find((m) => m.id === action.payload.id);
      if (!exists) {
        state.messages.push(action.payload);
      }
    },
    setConnected(state, action: PayloadAction<boolean>) {
      state.connected = action.payload;
    },
    setTyping(state, action: PayloadAction<{ userId: string; isTyping: boolean }>) {
      state.typingUsers[action.payload.userId] = action.payload.isTyping;
    },
    clearConversation(state) {
      state.id = null;
      state.messages = [];
      state.typingUsers = {};
      state.connected = false;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createConversation.fulfilled, (state, action) => {
        state.loading = false;
        state.id = action.payload.id;
      })
      .addCase(createConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(sendMessageAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessageAsync.fulfilled, (state, action) => {
        state.loading = false;
        // message shape should match Message
        const payload = action.payload as Message;
        // push if not exists
        const exists = state.messages.find((m) => m.id === payload.id);
        if (!exists) {
          state.messages.push(payload);
        }
      })
      .addCase(sendMessageAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setConversationId, addMessage, setConnected, setTyping, clearConversation } =
  conversationSlice.actions;

export default conversationSlice.reducer;
