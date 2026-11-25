import type { Mock } from 'vitest';

import type { FavoritesSummary, Show } from '~/types';

import { toCall, type ApiCall } from './api-call';

export type { ApiCall } from './api-call';

export type ApiRoutes = {
  search?: (call: ApiCall) => unknown;
  favoritesCount?: () => unknown;
  favoritesPage?: (page: number) => unknown;
  addFavorite?: (show: Show) => unknown;
  removeFavorite?: (id: number) => unknown;
  authMe?: () => unknown;
  login?: (email: string) => unknown;
  logout?: () => unknown;
};

/**
 * Routes every `requestJson` call to the response for its endpoint. Search
 * has no default — a suite that searches must say what the backend serves.
 * An unmounted HomePage still syncs the favorites summary, so that endpoint
 * defaults to the empty summary.
 */
export const stubApi = (mock: Mock, routes: ApiRoutes = {}): void => {
  mock.mockImplementation(async (url: string, init?: unknown) => {
    const call = toCall(url, init);
    const emptySummary: FavoritesSummary = { count: 0, ids: [] };

    if (call.path === '/api/auth/me' && call.method === 'GET') {
      return routes.authMe?.();
    }

    if (call.path === '/api/auth/login' && call.method === 'POST') {
      return routes.login?.((call.body as { email: string }).email);
    }

    if (call.path === '/api/auth/logout' && call.method === 'POST') {
      return routes.logout?.();
    }

    if (call.path === '/api/search') {
      return routes.search?.(call);
    }

    if (call.path === '/api/favorites/count') {
      return routes.favoritesCount?.() ?? emptySummary;
    }

    if (call.path === '/api/favorites' && call.method === 'GET') {
      return routes.favoritesPage?.(Number(call.params.get('page') ?? 1));
    }

    if (call.path === '/api/favorites' && call.method === 'POST') {
      return routes.addFavorite?.((call.body as { show: Show }).show);
    }

    if (call.path.startsWith('/api/favorites/') && call.method === 'DELETE') {
      const id = Number(call.path.slice('/api/favorites/'.length));
      return routes.removeFavorite?.(id);
    }

    throw new Error(`Unexpected API call: ${call.method} ${url}`);
  });
};

export const apiCalls = (mock: Mock): ApiCall[] =>
  mock.mock.calls.map(([url, init]) => toCall(String(url), init));

export const searchCalls = (mock: Mock): ApiCall[] =>
  apiCalls(mock).filter((call) => call.path === '/api/search');

export const lastSearchCall = (mock: Mock): ApiCall | undefined => {
  const calls = searchCalls(mock);

  return calls[calls.length - 1];
};

export const searchSelection = (call: ApiCall | undefined) => ({
  genre: call?.params.get('genre') ?? undefined,
  page: Number(call?.params.get('page') ?? 1),
});

export const favoritesPageRequests = (mock: Mock): number[] =>
  apiCalls(mock)
    .filter((call) => call.path === '/api/favorites' && call.method === 'GET')
    .map((call) => Number(call.params.get('page') ?? 1));

export const favoriteWrites = (mock: Mock): ApiCall[] =>
  apiCalls(mock).filter(
    (call) =>
      call.method !== 'GET' &&
      call.path.startsWith('/api/favorites') &&
      call.path !== '/api/favorites/count',
  );
