import type { Mock } from 'vitest';

import { stubApi, type ApiRoutes } from '~/test/api-mock';

import type { FavoritesBackend } from './favoritesHarness';

/**
 * Routes the favorites endpoints for a suite: the real summary and page by
 * default — the mount summary sync must mirror the fake backend — with
 * per-suite overrides for writes and failures.
 */
export const stubFavoritesApi = (
  mock: Mock,
  backend: FavoritesBackend,
  routes: ApiRoutes = {},
): void => {
  stubApi(mock, {
    favoritesCount: backend.summary,
    favoritesPage: backend.fetchPage,
    ...routes,
  });
};
