import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  addFavoriteShow,
  fetchFavoritesCount,
  removeFavoriteShow,
} from '@api/favorites';
import { searchShowsPage } from '@api/shows';
import { notify } from '@notification';
import { replaceFavoritesSummary, store } from '@store';

import {
  click,
  page1,
  renderHomePage,
  settle,
  typeQuery,
} from '../../../test/home-flow';

// The toasts follow the results the mocked favorites API resolves with.
// Both boundary mocks are declared in this file — vi.mock only hoists
// inside suites, never inside the shared helper.
vi.mock('@api/shows', () => ({ searchShowsPage: vi.fn() }));
vi.mock('@api/favorites', () => ({
  addFavoriteShow: vi.fn(),
  removeFavoriteShow: vi.fn(),
  fetchFavoritesCount: vi.fn(),
  fetchFavoritesListPage: vi.fn(),
}));
// The notification boundary: the suite asserts the presenter calls the
// library-independent notify API — Sonner itself never renders here, and
// its auto-dismiss behavior is asserted in the E2E spec instead.
vi.mock('@notification', () => ({
  notify: { success: vi.fn(), info: vi.fn() },
}));

const favoriteButton = (name: string) => screen.getByRole('button', { name });

const emptySummary = { count: 0, ids: [] };

// Renders the page, searches and settles the debounce — the cards appear
// with the summaries the mocks resolve with at that moment.
const searchAsGuest = async () => {
  renderHomePage();
  typeQuery('office');
  await settle();
};

describe('HomePage favorites toasts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    store.dispatch(replaceFavoritesSummary(emptySummary));
    vi.mocked(notify.success).mockClear();
    vi.mocked(notify.info).mockClear();
    vi.mocked(searchShowsPage).mockReset().mockResolvedValue(page1);
    vi.mocked(fetchFavoritesCount).mockReset().mockResolvedValue(emptySummary);
    vi.mocked(addFavoriteShow)
      .mockReset()
      .mockResolvedValue({ count: 1, ids: [1] });
    vi.mocked(removeFavoriteShow).mockReset().mockResolvedValue(emptySummary);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('a successful add toasts the addition message', async () => {
    await searchAsGuest();

    await click(favoriteButton('Add Show One to favorites'));

    expect(notify.success).toHaveBeenCalledWith(
      '"Show One" was added to favorites',
    );
  });

  it('a successful removal toasts the distinct removal message', async () => {
    await searchAsGuest();
    await click(favoriteButton('Add Show One to favorites'));

    await click(favoriteButton('Remove Show One from favorites'));

    expect(notify.info).toHaveBeenCalledWith(
      '"Show One" was removed from favorites',
    );
  });

  it('a failed toggle toasts nothing', async () => {
    await searchAsGuest();
    vi.mocked(addFavoriteShow).mockRejectedValue(new Error('offline'));

    await click(favoriteButton('Add Show One to favorites'));

    expect(notify.success).not.toHaveBeenCalled();
    expect(notify.info).not.toHaveBeenCalled();
  });
});
