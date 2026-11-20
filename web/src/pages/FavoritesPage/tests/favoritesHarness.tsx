import { cleanup, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

import type { Show } from '~/types';
import { replaceFavoritesSummary, store } from '~/store';

import type { FavoritesLocationState } from '../../types';

import { FavoritesPage } from '..';
import { LocationProbe } from '../../../test/location-probe';

const show = (id: number, name: string): Show =>
  ({ id, name, genres: ['Drama'], premiered: '2010-05-01' }) as Show;
const ALL = ['One', 'Two', 'Three', 'Four'].map((n, i) =>
  show(i + 1, `Show ${n}`),
);

// A fake favorites backend: three per page, clamped pages, live writes.
export const createFavoritesBackend = () => {
  let storage: Show[] = [];

  const summary = () => ({
    count: storage.length,
    ids: storage.map((item) => item.id),
  });

  const fetchPage = async (page: number) => {
    const pageCount = Math.max(1, Math.ceil(storage.length / 3));
    const clamped = Math.min(Math.max(1, page), pageCount);

    return {
      shows: storage.slice((clamped - 1) * 3, clamped * 3),
      page: clamped,
      pageCount,
      totalCount: storage.length,
    };
  };

  // The real storage is a record iterated in ascending id order, and
  // re-adding a known id keeps its position — mirror both here.
  const add = async (item: Show) => {
    storage = [...storage.filter((entry) => entry.id !== item.id), item].sort(
      (a, b) => a.id - b.id,
    );
    return summary();
  };

  const remove = async (id: number) => {
    storage = storage.filter((item) => item.id !== id);
    return summary();
  };

  return {
    reset: () => {
      storage = [...ALL];
    },
    clear: () => {
      storage = [];
    },
    summary,
    fetchPage,
    add,
    remove,
  };
};

export type FavoritesBackend = ReturnType<typeof createFavoritesBackend>;

export type FavoritesEntry =
  string | { pathname: string; state?: FavoritesLocationState };

// Every suite starts from a clean Entity and mock history.
export const resetFavorites = (backend: FavoritesBackend) => {
  backend.reset();
  store.dispatch(replaceFavoritesSummary(backend.summary()));
  vi.clearAllMocks();
  cleanup();
};

export const renderFavoritesPage = (
  entries: FavoritesEntry[] = ['/favorites'],
) =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={entries}>
        <LocationProbe />
        <Routes>
          <Route path="/" element={<h1>Home stub</h1>} />
          <Route path="/favorites" element={<FavoritesPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );

export const heading = (name: string) => screen.findByRole('heading', { name });
export const button = (name: string) => screen.getByRole('button', { name });
export const location = () => screen.getByTestId('location').textContent ?? '';
export const navigationType = () =>
  screen.getByTestId('navigation-type').textContent ?? '';

export const mountFavorites = async (
  first = 'Show One',
  entries: FavoritesEntry[] = ['/favorites'],
) => {
  renderFavoritesPage(entries);
  await heading(first);
};
