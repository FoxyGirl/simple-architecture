import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  addFavoriteShow,
  fetchFavoritesListPage,
  removeFavoriteShow,
} from '@api/favorites';
import { notify } from '@notification';

import {
  createFavoritesBackend,
  mountFavorites,
  resetFavorites,
} from './favoritesHarness';

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

const backend = createFavoritesBackend();
const listMock = vi.mocked(fetchFavoritesListPage);
const removeMock = vi.mocked(removeFavoriteShow);
const addMock = vi.mocked(addFavoriteShow);
listMock.mockImplementation(backend.fetchPage);
removeMock.mockImplementation(backend.remove);
addMock.mockImplementation(backend.add);

describe('FavoritesPage toasts', () => {
  beforeEach(() => resetFavorites(backend));
  afterEach(() => cleanup());

  it('a successful removal toasts the confirmation', async () => {
    await mountFavorites();

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
    await mountFavorites();
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

  it('a successful re-add toasts the addition', async () => {
    await mountFavorites();
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove Show One from favorites' }),
    );
    const addHeart = await screen.findByRole('button', {
      name: 'Add Show One to favorites',
    });

    fireEvent.click(addHeart);

    await vi.waitFor(() =>
      expect(notify.success).toHaveBeenCalledWith(
        '"Show One" was added to favorites',
      ),
    );
    expect(notify.info).toHaveBeenCalledTimes(1);
  });

  it('a failed re-add toasts nothing and refetches nothing', async () => {
    await mountFavorites();
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove Show One from favorites' }),
    );
    const addHeart = await screen.findByRole('button', {
      name: 'Add Show One to favorites',
    });
    addMock.mockRejectedValueOnce(new Error('offline'));

    fireEvent.click(addHeart);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(notify.success).not.toHaveBeenCalled();
    expect(listMock).toHaveBeenCalledTimes(1);
  });
});
