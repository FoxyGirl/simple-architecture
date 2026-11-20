import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it } from 'vitest';

import { favoritesReducer } from '../../favorites';
import { showsReducer } from '../../shows';
import {
  replaceSearchSession,
  searchSessionReducer,
  selectSearchSession,
} from '..';

// A store owning the search-session entity: the Entity is independent of
// any other module, so its suite exercises it in isolation. The other
// reducers are mounted only because the RootState selectors are typed
// against the whole store shape.
const createTestStore = () =>
  configureStore({
    reducer: {
      searchSession: searchSessionReducer,
      shows: showsReducer,
      favorites: favoritesReducer,
    },
  });

describe('search-session entity', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it('starts with no session on a fresh app start', () => {
    expect(store.getState().searchSession).toBeNull();
    expect(selectSearchSession(store.getState())).toBeNull();
  });

  it('replaceSearchSession stores the successful search verbatim', () => {
    const session = { query: 'world', genre: 'Drama', page: 2 };

    store.dispatch(replaceSearchSession(session));

    expect(store.getState().searchSession).toEqual(session);
    expect(selectSearchSession(store.getState())).toEqual(session);
  });

  it('replaceSearchSession(null) clears the persisted session', () => {
    store.dispatch(
      replaceSearchSession({ query: 'world', genre: 'Drama', page: 2 }),
    );
    store.dispatch(replaceSearchSession(null));

    expect(selectSearchSession(store.getState())).toBeNull();
  });
});
