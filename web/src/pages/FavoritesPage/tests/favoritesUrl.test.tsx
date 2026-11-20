import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchFavoritesListPage, removeFavoriteShow } from '@api/favorites';
import type { Show } from '@api/types';
import { replaceFavoritesSummary, store } from '@store';

import { FavoritesPage } from '..';
import { LocationProbe } from '../../../test/location-probe';

vi.mock('@api/favorites', () => ({
  addFavoriteShow: vi.fn(),
  removeFavoriteShow: vi.fn(),
  fetchFavoritesCount: vi.fn(),
  fetchFavoritesListPage: vi.fn(),
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
const location = () => screen.getByTestId('location').textContent ?? '';
const navigationType = () =>
  screen.getByTestId('navigation-type').textContent ?? '';
const button = (name: string) => screen.getByRole('button', { name });
const renderPage = (entries: string[]) =>
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

const mount = async (entries: string[], first: string) => {
  renderPage(entries);
  await screen.findByRole('heading', { name: first });
};

describe('FavoritesPage URL page', () => {
  beforeEach(() => {
    storage = [...ALL];
    store.dispatch(replaceFavoritesSummary(sum()));
    vi.clearAllMocks();
    cleanup();
  });

  it('reads the list page from the URL on mount', async () => {
    await mount(['/favorites?page=2'], 'Show Four');
    expect(listMock).toHaveBeenCalledWith(2);
    expect(location()).toBe('/favorites?page=2');
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
  });

  it('invalid page values fetch page 1', async () => {
    await mount(['/favorites?page=abc'], 'Show One');
    expect(listMock).toHaveBeenCalledWith(1);

    cleanup();
    vi.clearAllMocks();
    await mount(['/favorites?page=0'], 'Show One');
    expect(listMock).toHaveBeenCalledWith(1);
  });

  it('a page change writes the URL page with push history', async () => {
    await mount(['/favorites'], 'Show One');

    fireEvent.click(button('Next page'));
    await screen.findByRole('heading', { name: 'Show Four' });

    expect(location()).toBe('/favorites?page=2');
    expect(navigationType()).toBe('PUSH');
    expect(listMock).toHaveBeenLastCalledWith(2);

    fireEvent.click(button('Previous page'));
    await screen.findByRole('heading', { name: 'Show One' });

    expect(location()).toBe('/favorites');
    expect(listMock).toHaveBeenLastCalledWith(1);
  });

  it('removal refetches the URL page and leaves clamping to the backend', async () => {
    await mount(['/favorites?page=2'], 'Show Four');

    fireEvent.click(button('Remove Show Four from favorites'));
    await screen.findByText('Page 1 of 1');

    expect(removeMock).toHaveBeenCalledWith(4);
    expect(listMock).toHaveBeenLastCalledWith(2);
    expect(location()).toBe('/favorites?page=2');
    expect(screen.getByText('3 shows saved to your list.')).toBeInTheDocument();
  });
});
