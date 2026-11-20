import { configureStore } from '@reduxjs/toolkit';

import { favoritesReducer } from './favorites';
import { showsReducer } from './shows';

export const store = configureStore({
  reducer: {
    shows: showsReducer,
    favorites: favoritesReducer,
  },
});
