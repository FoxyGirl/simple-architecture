import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestJson } from '~/api/request';
import { clearFavorites, clearSession, store } from '~/store';
import { lastSearchCall, searchSelection, stubApi } from '~/test/api-mock';

import { homeHeading, location, renderAt } from './routesHarness';

vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();
  return { ...actual, requestJson: vi.fn() };
});

const api = vi.mocked(requestJson);

const emptyPage = { shows: [], page: 1, pageCount: 1, totalCount: 0 };

describe('App favorites exit', () => {
  beforeEach(() => {
    api.mockReset();
    store.dispatch(clearSession());
    store.dispatch(clearFavorites());
  });

  afterEach(cleanup);

  it('restores the remembered home view when the favorites page signs out', async () => {
    stubApi(api, {
      authMe: () => ({ email: 'ada@example.com' }),
      favoritesPage: () => emptyPage,
      logout: () => ({ email: null }),
      // The restored genre must be on offer, or the page corrects the URL.
      search: () => ({
        ...emptyPage,
        page: 2,
        pageCount: 2,
        genres: ['Comedy'],
      }),
    });

    renderAt('/favorites', { fromHome: '/?search=ban&genre=Comedy&page=2' });

    await screen.findByRole('heading', { name: 'Favorites' });
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() =>
      expect(location()).toBe('/?search=ban&genre=Comedy&page=2'),
    );
    expect(homeHeading()).toBeVisible();

    // The restored URL drives the next search, so the whole Home view returns.
    await waitFor(() => expect(lastSearchCall(api)).toBeDefined());
    expect(searchSelection(lastSearchCall(api))).toEqual({
      genre: 'Comedy',
      page: 2,
    });
  });
});
