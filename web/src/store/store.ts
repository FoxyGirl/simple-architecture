import { configureStore } from '@reduxjs/toolkit';

import { showsReducer } from './shows';

export const store = configureStore({
  reducer: {
    shows: showsReducer,
  },
});
