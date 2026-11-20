import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestJson } from '~/api/request';
import { notify } from '~/notification';
import { favoritesPageRequests, stubApi } from '~/test/api-mock';

import {
  createFavoritesBackend,
  mountFavorites,
  resetFavorites,
} from './favoritesHarness';

vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();

  return { ...actual, requestJson: vi.fn() };
});
// The notification boundary: the suite asserts the presenter calls the
// library-independent notify API — Sonner itself never renders here.
vi.mock('~/notification', () => ({
  notify: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

const api = vi.mocked(requestJson);

const backend = createFavoritesBackend();

const stubBackend = () =>
  stubApi(api, {
    favoritesPage: backend.fetchPage,
    addFavorite: backend.add,
    removeFavorite: backend.remove,
  });

describe('FavoritesPage toasts', () => {
  beforeEach(() => {
    resetFavorites(backend);
    api.mockReset();
    stubBackend();
  });
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

  it('a failed removal shows the error notification and refetches nothing', async () => {
    await mountFavorites();
    stubApi(api, {
      favoritesPage: backend.fetchPage,
      removeFavorite: () => {
        throw new Error('offline');
      },
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Remove Show One from favorites' }),
    );
    // One macrotask later every rejection microtask of the toggle chain
    // has settled — a toast or a refetch would be visible by now.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(notify.error).toHaveBeenCalledWith('offline');
    expect(notify.info).not.toHaveBeenCalled();
    expect(notify.success).not.toHaveBeenCalled();
    expect(favoritesPageRequests(api)).toHaveLength(1);
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

  it('a failed re-add shows the error notification and refetches nothing', async () => {
    await mountFavorites();
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove Show One from favorites' }),
    );
    const addHeart = await screen.findByRole('button', {
      name: 'Add Show One to favorites',
    });
    stubApi(api, {
      favoritesPage: backend.fetchPage,
      addFavorite: () => {
        throw new Error('offline');
      },
    });

    fireEvent.click(addHeart);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(notify.error).toHaveBeenCalledWith('offline');
    expect(notify.success).not.toHaveBeenCalled();
    expect(favoritesPageRequests(api)).toHaveLength(1);
  });
});
