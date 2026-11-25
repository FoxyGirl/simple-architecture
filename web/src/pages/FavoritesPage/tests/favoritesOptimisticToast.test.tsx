import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestJson } from '~/api/request';
import { notify } from '~/notification';
import type { FavoritesSummary, Show } from '~/types';

import {
  createFavoritesBackend,
  mountFavorites,
  resetFavorites,
} from './favoritesHarness';
import { stubFavoritesApi } from './stubFavoritesApi';

vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();
  return { ...actual, requestJson: vi.fn() };
});
vi.mock('~/notification', () => ({
  notify: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

const api = vi.mocked(requestJson);
const backend = createFavoritesBackend();

const deferred = () => {
  let resolve!: (summary: FavoritesSummary) => void;
  const promise = new Promise<FavoritesSummary>((res) => {
    resolve = res;
  });

  return { promise, resolve };
};

const showOne = {
  id: 1,
  name: 'Show One',
  genres: ['Drama'],
  premiered: '2010-05-01',
} as Show;

describe('FavoritesPage optimistic toasts', () => {
  beforeEach(() => {
    resetFavorites(backend);
    api.mockReset();
    stubFavoritesApi(api, backend, {
      addFavorite: backend.add,
      removeFavorite: backend.remove,
    });
  });

  afterEach(cleanup);

  it('toasts a removal only after the backend confirms', async () => {
    const gate = deferred();

    await mountFavorites();
    stubFavoritesApi(api, backend, { removeFavorite: () => gate.promise });

    fireEvent.click(
      screen.getByRole('button', { name: 'Remove Show One from favorites' }),
    );
    await act(async () => {});

    expect(notify.info).not.toHaveBeenCalled();

    await act(async () => {
      gate.resolve(await backend.remove(1));
    });

    expect(notify.info).toHaveBeenCalledWith(
      '"Show One" was removed from favorites',
    );
  });

  it('toasts a re-add only after the backend confirms', async () => {
    await mountFavorites();
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove Show One from favorites' }),
    );
    const addHeart = await screen.findByRole('button', {
      name: 'Add Show One to favorites',
    });
    await vi.waitFor(() => expect(addHeart).toBeEnabled());
    vi.mocked(notify.info).mockClear();

    const gate = deferred();

    stubFavoritesApi(api, backend, { addFavorite: () => gate.promise });
    fireEvent.click(addHeart);
    await act(async () => {});

    expect(notify.success).not.toHaveBeenCalled();

    await act(async () => {
      gate.resolve(await backend.add(showOne));
    });

    expect(notify.success).toHaveBeenCalledWith(
      '"Show One" was added to favorites',
    );
  });
});
