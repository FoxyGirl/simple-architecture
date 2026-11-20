import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchFavoritesListPage, removeFavoriteShow } from '@api/favorites';
import type { Show } from '@api/types';
import { replaceFavoritesSummary, store } from '@store';

import { FavoritesPage } from '..';
import { LocationProbe } from '../../../test/location-probe';

// A fake backend favorites API: three per page, clamped pages, live removals.
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

// The router-wrapped render; the home route stub detects navigation.
const renderFavoritesPage = () =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/favorites']}>
        <LocationProbe />
        <Routes>
          <Route path="/" element={<h1>Home stub</h1>} />
          <Route path="/favorites" element={<FavoritesPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
const heading = (name: string) => screen.findByRole('heading', { name });
const button = (name: string) => screen.getByRole('button', { name });
const mount = async (first = 'Show One') => {
  renderFavoritesPage();
  await heading(first);
};

describe('FavoritesPage', () => {
  beforeEach(() => {
    storage = [...ALL];
    store.dispatch(replaceFavoritesSummary(sum()));
    vi.clearAllMocks();
    cleanup();
  });

  it('fetches the first backend page and lists three shows per page', async () => {
    await mount('Show Three');
    expect(listMock).toHaveBeenCalledWith(1);
    expect(screen.queryByRole('heading', { name: 'Show Four' })).toBeNull();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('4 shows saved to your list.')).toBeInTheDocument();
  });

  it('Next and Prev write the URL page and fetch it', async () => {
    await mount();
    fireEvent.click(button('Next page'));
    await heading('Show Four');
    expect(location()).toBe('/favorites?page=2');
    expect(navigationType()).toBe('PUSH');
    expect(listMock).toHaveBeenLastCalledWith(2);
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    fireEvent.click(button('Previous page'));
    await heading('Show One');
    expect(location()).toBe('/favorites');
    expect(listMock).toHaveBeenLastCalledWith(1);
  });

  it('removing a show goes through the API and refreshes the list', async () => {
    await mount();
    fireEvent.click(button('Remove Show One from favorites'));
    await screen.findByText('Page 1 of 1');
    expect(removeMock).toHaveBeenCalledWith(1);
    expect(screen.queryByRole('heading', { name: 'Show One' })).toBeNull();
    await heading('Show Four');
    expect(screen.getByText('3 shows saved to your list.')).toBeInTheDocument();
  });

  it('keeps the empty state with its actions when nothing is favorited', async () => {
    storage = [];
    renderFavoritesPage();
    expect(await screen.findByText(/No favorites yet/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
    expect(button('Back to Home')).toBeInTheDocument();
    fireEvent.click(button('Browse shows'));
    expect(await heading('Home stub')).toBeTruthy();
  });

  it('the back button navigates to the catalogue', async () => {
    await mount();
    fireEvent.click(button('Back to Home'));
    expect(await heading('Home stub')).toBeTruthy();
  });
});
