import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchFavoritesListPage, removeFavoriteShow } from '@api/favorites';
import type { Show } from '@api/types';
import { notify } from '@notification';
import { replaceFavoritesSummary, store } from '@store';

import { FavoritesPage } from '..';

// The same fake backend favorites API as the page suite: three per page,
// removals visible to the refetch that follows a successful toggle.
vi.mock('@api/favorites', () => ({
  addFavoriteShow: vi.fn(),
  removeFavoriteShow: vi.fn(),
  fetchFavoritesCount: vi.fn(),
  fetchFavoritesListPage: vi.fn(),
}));
// The notification boundary: the suite asserts the presenter calls the
// library-independent notify API — Sonner itself never renders here.
vi.mock('@notification', () => ({
  notify: { success: vi.fn(), info: vi.fn() },
}));

const show = (id: number, name: string): Show =>
  ({ id, name, genres: ['Drama'], premiered: '2010-05-01' }) as Show;
const ALL = ['One', 'Two', 'Three', 'Four'].map((n, i) =>
  show(i + 1, `Show ${n}`),
);
let storage: Show[] = [];

const sum = () => ({ count: storage.length, ids: storage.map((s) => s.id) });
const fakeFetchPage = async (page: number) => {
  const pageCount = Math.max(1, Math.ceil(storage.length / 3));
  const clamped = Math.min(Math.max(1, page), pageCount);
  return {
    shows: storage.slice((clamped - 1) * 3, clamped * 3),
    page: clamped,
    pageCount,
    totalCount: storage.length,
  };
};
const fakeRemove = async (id: number) => {
  storage = storage.filter((s) => s.id !== id);
  return sum();
};

const listMock = vi.mocked(fetchFavoritesListPage);
const removeMock = vi.mocked(removeFavoriteShow);
listMock.mockImplementation(fakeFetchPage);
removeMock.mockImplementation(fakeRemove);

const renderFavoritesPage = () =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/favorites']}>
        <Routes>
          <Route path="/" element={<h1>Home stub</h1>} />
          <Route path="/favorites" element={<FavoritesPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );

const mount = async () => {
  renderFavoritesPage();
  await screen.findByRole('heading', { name: 'Show One' });
};

describe('FavoritesPage toasts', () => {
  beforeEach(() => {
    storage = [...ALL];
    store.dispatch(replaceFavoritesSummary(sum()));
    vi.clearAllMocks();
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it('a successful removal toasts the confirmation', async () => {
    await mount();

    fireEvent.click(
      screen.getByRole('button', { name: 'Remove Show One from favorites' }),
    );

    await vi.waitFor(() =>
      expect(notify.info).toHaveBeenCalledWith(
        '"Show One" was removed from favorites',
      ),
    );
  });

  it('a failed removal toasts nothing and refetches nothing', async () => {
    await mount();
    removeMock.mockRejectedValueOnce(new Error('offline'));

    fireEvent.click(
      screen.getByRole('button', { name: 'Remove Show One from favorites' }),
    );
    // One macrotask later every rejection microtask of the toggle chain
    // has settled — a toast or a refetch would be visible by now.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(notify.info).not.toHaveBeenCalled();
    expect(notify.success).not.toHaveBeenCalled();
    expect(listMock).toHaveBeenCalledTimes(1);
  });
});
