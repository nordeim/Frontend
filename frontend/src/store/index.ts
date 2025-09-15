// frontend/src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import type { TypedUseSelectorHook } from 'react-redux';
import { useDispatch, useSelector } from 'react-redux';
import conversationReducer from './slices/conversationSlice';
// Placeholder imports for auth/ui reducers - keep them optional and easy to add
// import authReducer from './slices/authSlice';
// import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    conversation: conversationReducer,
    // auth: authReducer,
    // ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // because we may carry non-serializable things (dates, errors) in actions intentionally
    }),
  devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks for usage in components
export const useAppDispatch = (): AppDispatch => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
