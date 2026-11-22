import { configureStore } from '@reduxjs/toolkit';

import { favoritesReducer } from './favorites';
import { sessionReducer } from './session';
import { showsReducer } from './shows';

export const store = configureStore({
  reducer: {
    shows: showsReducer,
    favorites: favoritesReducer,
    session: sessionReducer,
  },
});
