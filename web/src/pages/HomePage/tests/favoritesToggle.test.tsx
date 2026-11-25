import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestJson } from '~/api/request';
import { notify } from '~/notification';
import {
  replaceFavoritesSummary,
  selectFavoriteIds,
  selectPendingFavoriteIds,
  store,
} from '~/store';
import { favoriteWrites, stubApi } from '~/test/api-mock';

import {
  click,
  page1,
  renderHomePage,
  settle,
  typeQuery,
} from '../../../test/home-flow';

vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();
  return { ...actual, requestJson: vi.fn() };
});
vi.mock('~/notification', () => ({
  notify: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

const api = vi.mocked(requestJson);

const favoriteButton = (name: string) => screen.getByRole('button', { name });

const favoriteIds = () => selectFavoriteIds(store.getState());

const emptySummary = { count: 0, ids: [] };

const searchAsGuest = async () => {
  renderHomePage();
  typeQuery('office');
  await settle();
};

describe('HomePage favorites toggle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    store.dispatch(replaceFavoritesSummary(emptySummary));
    api.mockReset();
    stubApi(api, {
      search: () => page1,
      favoritesCount: () => emptySummary,
      addFavorite: () => ({ count: 1, ids: [1] }),
      removeFavorite: () => emptySummary,
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('clicking the button adds the show through the backend and presses the heart', async () => {
    await searchAsGuest();

    await click(favoriteButton('Add Show One to favorites'));

    expect(favoriteWrites(api)).toEqual([
      expect.objectContaining({
        path: '/api/favorites',
        method: 'POST',
        body: { show: page1.shows[0] },
      }),
    ]);
    expect(favoriteIds()).toEqual([1]);
    expect(
      favoriteButton('Remove Show One from favorites'),
    ).toBeInTheDocument();
  });

  it('clicking the pressed button removes the show through the backend', async () => {
    await searchAsGuest();
    await click(favoriteButton('Add Show One to favorites'));

    await click(favoriteButton('Remove Show One from favorites'));

    expect(favoriteWrites(api)).toContainEqual(
      expect.objectContaining({
        path: '/api/favorites/1',
        method: 'DELETE',
      }),
    );
    expect(favoriteIds()).toEqual([]);
    expect(favoriteButton('Add Show One to favorites')).toBeInTheDocument();
  });

  it('a failed toggle rolls back the overlay and leaves the heart unpressed', async () => {
    await searchAsGuest();
    stubApi(api, {
      search: () => page1,
      addFavorite: () => {
        throw new Error('offline');
      },
    });

    await click(favoriteButton('Add Show One to favorites'));

    expect(favoriteIds()).toEqual([]);
    expect(selectPendingFavoriteIds(store.getState())).toEqual([]);
    expect(notify.error).toHaveBeenCalledWith('offline');
    expect(favoriteButton('Add Show One to favorites')).toBeInTheDocument();
  });
});
