import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { AuthSession } from '~/types';

import type { SessionState } from './types';

const EMPTY_STATE: SessionState = { email: null };

const sessionSlice = createSlice({
  name: 'session',
  initialState: EMPTY_STATE,
  reducers: {
    // The backend owns the signed-in identity, so its session envelope is
    // stored verbatim. `clearSession` is the local reset the auth Tasks use
    // for logout and for a failed boot restore.
    replaceSession(state, action: PayloadAction<AuthSession>) {
      state.email = action.payload.email;
    },
    clearSession(state) {
      state.email = null;
    },
  },
});

export const { clearSession, replaceSession } = sessionSlice.actions;
export const sessionReducer = sessionSlice.reducer;
