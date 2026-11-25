import type { store } from './store';

/** The whole Redux state — root of the Entity selectors. */
export type RootState = ReturnType<typeof store.getState>;

/** The typed store dispatch. */
export type AppDispatch = typeof store.dispatch;
