import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchFavoritesCount } from '@api/favorites';
import { searchShowsPage } from '@api/shows';
import type { SearchPage, Show } from '@api/types';
import { replaceSearchSession, store } from '@store';

import {
  arrow,
  card,
  chip,
  click,
  page1,
  remountHomePage,
  renderHomePage,
  settle,
  storedPage,
  typeQuery,
} from '../../../test/home-flow';

// The presenter runs over the mocked API boundary (vi.mock never hoists
// inside the shared helper, so both mocks live in this suite).
vi.mock('@api/shows', () => ({ searchShowsPage: vi.fn() }));
vi.mock('@api/favorites', () => ({
  addFavoriteShow: vi.fn(),
  removeFavoriteShow: vi.fn(),
  fetchFavoritesCount: vi.fn(),
  fetchFavoritesListPage: vi.fn(),
}));

const show = (id: number, name: string): Show =>
  ({ id, name, genres: ['Drama'] }) as Show;

const dramaPage1: SearchPage = {
  shows: [
    show(10, 'Drama One'),
    show(11, 'Drama Two'),
    show(12, 'Drama Three'),
  ],
  page: 1,
  pageCount: 2,
  totalCount: 4,
  genres: ['Comedy', 'Drama'],
};

const dramaPage2: SearchPage = {
  shows: [show(13, 'Drama Four')],
  page: 2,
  pageCount: 2,
  totalCount: 4,
  genres: ['Comedy', 'Drama'],
};

const input = () =>
  screen.getByRole('textbox', { name: 'Search for TV shows' });

describe('HomePage search-state restoration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(searchShowsPage).mockReset().mockResolvedValue(page1);
    vi.mocked(fetchFavoritesCount)
      .mockReset()
      .mockResolvedValue({ count: 0, ids: [] });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('a fresh app start stays idle with an empty input', async () => {
    renderHomePage();
    await settle();
    expect(input()).toHaveValue('');
    expect(searchShowsPage).not.toHaveBeenCalled();
    expect(screen.queryByText('Page 1 of 2')).toBeNull();
  });

  it('remounting restores input, genre, page and cards', async () => {
    const view = renderHomePage();
    typeQuery('office');
    await settle();

    vi.mocked(searchShowsPage).mockResolvedValueOnce(dramaPage1);
    await click(chip('Drama'));
    vi.mocked(searchShowsPage).mockResolvedValueOnce(dramaPage2);
    await click(arrow('Next page'));
    const calls = vi.mocked(searchShowsPage).mock.calls.length;

    view.unmount();
    remountHomePage();
    await settle();
    expect(input()).toHaveValue('office');
    expect(chip('Drama')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(card('Drama Four')).toBeInTheDocument();
    expect(searchShowsPage).toHaveBeenCalledTimes(calls);
    expect(storedPage()).toEqual(dramaPage2);
  });

  it('re-issues the persisted request when its result is gone', async () => {
    const view = renderHomePage();
    view.unmount();
    store.dispatch(
      replaceSearchSession({ query: 'office', genre: 'Drama', page: 2 }),
    );
    vi.mocked(searchShowsPage).mockResolvedValueOnce(dramaPage2);
    remountHomePage();
    await settle();

    expect(searchShowsPage).toHaveBeenCalledWith(
      'office',
      { genre: 'Drama', page: 2 },
      expect.anything(),
    );
    expect(input()).toHaveValue('office');
    expect(card('Drama Four')).toBeInTheDocument();
  });
});
