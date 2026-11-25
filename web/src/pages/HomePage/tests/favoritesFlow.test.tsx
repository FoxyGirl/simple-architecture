import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestJson } from '~/api/request';
import { replaceFavoritesSummary, selectFavoriteIds, store } from '~/store';
import { apiCalls, stubApi } from '~/test/api-mock';

import {
  page1,
  renderHomePage,
  settle,
  typeQuery,
} from '../../../test/home-flow';

// The hearts follow the summaries the mocked request boundary resolves with.
// The mock is declared in this file — vi.mock only hoists inside suites,
// never inside the shared helper.
vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();
  return { ...actual, requestJson: vi.fn() };
});

const api = vi.mocked(requestJson);

const favoriteButton = (name: string) => screen.getByRole('button', { name });

const favoriteIds = () => selectFavoriteIds(store.getState());

const emptySummary = { count: 0, ids: [] };

// Renders the page, searches and settles the debounce — the cards appear
// with the summaries the mocks resolve with at that moment.
const searchAsGuest = async () => {
  renderHomePage();
  typeQuery('office');
  await settle();
};

describe('HomePage favorites flow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    store.dispatch(replaceFavoritesSummary(emptySummary));
    api.mockReset();
    stubApi(api, {
      search: () => page1,
      favoritesCount: () => emptySummary,
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('syncs the favorite summary from the backend on mount', async () => {
    stubApi(api, {
      search: () => page1,
      favoritesCount: () => ({ count: 2, ids: [2, 3] }),
    });

    renderHomePage();
    typeQuery('office');
    await settle();

    expect(apiCalls(api)).toContainEqual(
      expect.objectContaining({
        path: '/api/favorites/count',
        method: 'GET',
      }),
    );
    expect(favoriteIds()).toEqual([2, 3]);
    expect(
      favoriteButton('Remove Show Two from favorites'),
    ).toBeInTheDocument();
    expect(favoriteButton('Add Show One to favorites')).toBeInTheDocument();
  });

  it('every result card offers a favorite button', async () => {
    await searchAsGuest();

    expect(favoriteButton('Add Show One to favorites')).toBeInTheDocument();
    expect(favoriteButton('Add Show Two to favorites')).toBeInTheDocument();
  });
});
