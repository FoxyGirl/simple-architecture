import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchFavoritesCount } from '@api/favorites';
import { searchShowsPage } from '@api/shows';
import type { SearchPage, Show } from '@api/types';

import {
  card,
  chip,
  remountHomePage,
  renderHomePage,
  settle,
  storedPage,
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

const dramaPage2: SearchPage = {
  shows: [show(13, 'Drama Four')],
  page: 2,
  pageCount: 2,
  totalCount: 4,
  genres: ['Comedy', 'Drama'],
};

const URL = '/?search=office&genre=Drama&page=2';

const input = () =>
  screen.getByRole('textbox', { name: 'Search for TV shows' });

const expectRestoredView = () => {
  expect(input()).toHaveValue('office');
  expect(chip('Drama')).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
  expect(card('Drama Four')).toBeInTheDocument();
  expect(storedPage()).toEqual(dramaPage2);
};

describe('HomePage URL restoration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(searchShowsPage).mockReset().mockResolvedValue(dramaPage2);
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
    expect(screen.queryByText('Page 2 of 2')).toBeNull();
  });

  it('mounting a parameterized URL restores and fetches that page', async () => {
    renderHomePage([URL]);
    await settle();

    expect(searchShowsPage).toHaveBeenCalledWith(
      'office',
      { genre: 'Drama', page: 2 },
      expect.anything(),
    );
    expectRestoredView();
  });

  it('remounting with the same URL restores the view and fetches again', async () => {
    const view = renderHomePage([URL]);
    await settle();

    view.unmount();
    remountHomePage([URL]);
    await settle();

    expect(searchShowsPage).toHaveBeenCalledTimes(2);
    expectRestoredView();
  });
});
