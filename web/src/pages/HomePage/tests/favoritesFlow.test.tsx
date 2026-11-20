import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  addFavoriteShow,
  fetchFavoritesCount,
  removeFavoriteShow,
} from '@api/favorites';
import { searchShowsPage } from '@api/shows';
import { replaceFavoritesSummary, selectFavoriteIds, store } from '@store';

import {
  click,
  page1,
  renderHomePage,
  settle,
  typeQuery,
} from '../../../test/home-flow';

// The hearts follow the summaries the mocked favorites API resolves with.
// Both boundary mocks are declared in this file — vi.mock only hoists
// inside suites, never inside the shared helper.
vi.mock('@api/shows', () => ({ searchShowsPage: vi.fn() }));
vi.mock('@api/favorites', () => ({
  addFavoriteShow: vi.fn(),
  removeFavoriteShow: vi.fn(),
  fetchFavoritesCount: vi.fn(),
  fetchFavoritesListPage: vi.fn(),
}));

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

  it('syncs the favorite summary from the backend on mount', async () => {
    vi.mocked(fetchFavoritesCount).mockResolvedValue({ count: 2, ids: [2, 3] });

    renderHomePage();
    typeQuery('office');
    await settle();

    expect(fetchFavoritesCount).toHaveBeenCalled();
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

  it('clicking the button adds the show through the API and presses the heart', async () => {
    await searchAsGuest();

    await click(favoriteButton('Add Show One to favorites'));

    expect(addFavoriteShow).toHaveBeenCalledWith(page1.shows[0]);
    expect(removeFavoriteShow).not.toHaveBeenCalled();
    expect(favoriteIds()).toEqual([1]);
    expect(
      favoriteButton('Remove Show One from favorites'),
    ).toBeInTheDocument();
  });

  it('clicking the pressed button removes the show through the API', async () => {
    await searchAsGuest();
    await click(favoriteButton('Add Show One to favorites'));

    await click(favoriteButton('Remove Show One from favorites'));

    expect(removeFavoriteShow).toHaveBeenCalledWith(1);
    expect(favoriteIds()).toEqual([]);
    expect(favoriteButton('Add Show One to favorites')).toBeInTheDocument();
  });

  it('a failed toggle dispatches nothing and leaves the heart unpressed', async () => {
    await searchAsGuest();
    vi.mocked(addFavoriteShow).mockRejectedValue(new Error('offline'));

    const before = store.getState().favorites;
    await click(favoriteButton('Add Show One to favorites'));

    expect(store.getState().favorites).toBe(before);
    expect(favoriteButton('Add Show One to favorites')).toBeInTheDocument();
  });
});
