import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchFavoritesListPage, removeFavoriteShow } from '@api/favorites';

import {
  button,
  createFavoritesBackend,
  heading,
  location,
  mountFavorites,
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
const removeMock = vi.mocked(removeFavoriteShow);
listMock.mockImplementation(backend.fetchPage);
removeMock.mockImplementation(backend.remove);

describe('FavoritesPage removal', () => {
  beforeEach(() => resetFavorites(backend));

  it('removing a show on page 1 refetches and refreshes the list', async () => {
    await mountFavorites();

    fireEvent.click(button('Remove Show One from favorites'));
    await screen.findByText('Page 1 of 1');

    expect(removeMock).toHaveBeenCalledWith(1);
    expect(screen.queryByRole('heading', { name: 'Show One' })).toBeNull();
    await heading('Show Four');
    expect(screen.getByText('3 shows saved to your list.')).toBeInTheDocument();
    expect(location()).toBe('/favorites');
  });

  it('removing on URL page 2 refetches that page and keeps the URL', async () => {
    await mountFavorites('Show Four', ['/favorites?page=2']);

    fireEvent.click(button('Remove Show Four from favorites'));
    await screen.findByText('Page 1 of 1');

    expect(removeMock).toHaveBeenCalledWith(4);
    expect(listMock).toHaveBeenLastCalledWith(2);
    expect(location()).toBe('/favorites?page=2');
    expect(screen.getByText('3 shows saved to your list.')).toBeInTheDocument();
  });
});
