import { cleanup, fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchFavoritesListPage } from '@api/favorites';

import {
  button,
  createFavoritesBackend,
  location,
  mountFavorites,
  navigationType,
  resetFavorites,
} from './favoritesHarness';

vi.mock('@api/favorites', () => ({
  addFavoriteShow: vi.fn(),
  removeFavoriteShow: vi.fn(),
  fetchFavoritesCount: vi.fn(),
  fetchFavoritesListPage: vi.fn(),
}));

const backend = createFavoritesBackend();
const listMock = vi.mocked(fetchFavoritesListPage);
listMock.mockImplementation(backend.fetchPage);

describe('FavoritesPage URL pagination', () => {
  beforeEach(() => resetFavorites(backend));

  it('reads the list page from the URL on mount', async () => {
    await mountFavorites('Show Four', ['/favorites?page=2']);

    expect(listMock).toHaveBeenCalledWith(2);
    expect(location()).toBe('/favorites?page=2');
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
  });

  it('invalid page values fetch page 1', async () => {
    await mountFavorites('Show One', ['/favorites?page=abc']);
    expect(listMock).toHaveBeenCalledWith(1);

    cleanup();
    vi.clearAllMocks();
    await mountFavorites('Show One', ['/favorites?page=0']);
    expect(listMock).toHaveBeenCalledWith(1);
  });

  it('page changes write the URL page with push history', async () => {
    await mountFavorites();

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

  it('Back to Home returns to the Home URL remembered by the entry', async () => {
    const state = { fromHome: '/?search=space&page=2' };
    await mountFavorites('Show One', [{ pathname: '/favorites', state }]);

    fireEvent.click(button('Next page'));
    await screen.findByRole('heading', { name: 'Show Four' });
    fireEvent.click(button('Back to Home'));

    expect(
      await screen.findByRole('heading', { name: 'Home stub' }),
    ).toBeTruthy();
    expect(location()).toBe('/?search=space&page=2');
  });
});
