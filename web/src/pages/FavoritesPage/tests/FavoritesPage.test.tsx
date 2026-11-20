import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchFavoritesListPage } from '@api/favorites';

import {
  button,
  createFavoritesBackend,
  heading,
  mountFavorites,
  renderFavoritesPage,
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

describe('FavoritesPage', () => {
  beforeEach(() => resetFavorites(backend));

  it('fetches the first backend page and lists three shows per page', async () => {
    await mountFavorites('Show Three');
    expect(listMock).toHaveBeenCalledWith(1);
    expect(screen.queryByRole('heading', { name: 'Show Four' })).toBeNull();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('4 shows saved to your list.')).toBeInTheDocument();
  });

  it('keeps the empty state with its actions when nothing is favorited', async () => {
    backend.clear();
    renderFavoritesPage();

    expect(await screen.findByText(/No favorites yet/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
    expect(button('Back to Home')).toBeInTheDocument();

    fireEvent.click(button('Browse shows'));
    expect(await heading('Home stub')).toBeTruthy();
  });

  it('the back button navigates to the catalogue', async () => {
    await mountFavorites();

    fireEvent.click(button('Back to Home'));
    expect(await heading('Home stub')).toBeTruthy();
  });
});
