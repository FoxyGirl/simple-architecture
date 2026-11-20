import { cleanup, fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Show } from '@api/types';
import {
  addFavoriteShow,
  fetchFavoritesListPage,
  removeFavoriteShow,
} from '@api/favorites';

import {
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
vi.mocked(removeFavoriteShow).mockImplementation(backend.remove);
vi.mocked(addFavoriteShow).mockImplementation(backend.add);

const label = (action: 'Remove' | 'Add', name: string) =>
  `${action} ${name} ${action === 'Remove' ? 'from' : 'to'} favorites`;
const heart = (action: 'Remove' | 'Add', name: string) =>
  screen.getByRole('button', { name: label(action, name) });
const findHeart = (action: 'Remove' | 'Add', name: string) =>
  screen.findByRole('button', { name: label(action, name) });

describe('FavoritesPage soft removal fresh fetches', () => {
  beforeEach(() => resetFavorites(backend));

  it('resets the marking on a page change and renders backend state', async () => {
    await mountFavorites();
    fireEvent.click(heart('Remove', 'Show One'));
    await findHeart('Add', 'Show One');
    await backend.add({
      id: 1,
      name: 'Show One',
      genres: ['Drama'],
      premiered: '2010-05-01',
    } as Show);

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await heading('Show Four');
    fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));

    expect(await findHeart('Remove', 'Show One')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(listMock).toHaveBeenLastCalledWith(1);
  });

  it('keeps every removed card listed until a fresh fetch is empty', async () => {
    await mountFavorites();

    for (const name of ['Show One', 'Show Two', 'Show Three']) {
      fireEvent.click(heart('Remove', name));
      await findHeart('Add', name);
    }

    for (const name of ['Show One', 'Show Two', 'Show Three']) {
      expect(heart('Add', name)).toHaveAttribute('aria-pressed', 'false');
    }
    expect(screen.queryByText(/No favorites yet/)).toBeNull();
    expect(screen.getByText('Page 1 of 2')).toBeVisible();
    expect(listMock).toHaveBeenCalledTimes(1);

    await backend.remove(4);
    cleanup();
    renderFavoritesPage();

    expect(await screen.findByText(/No favorites yet/)).toBeVisible();
    expect(listMock).toHaveBeenCalledTimes(2);
  });
});
