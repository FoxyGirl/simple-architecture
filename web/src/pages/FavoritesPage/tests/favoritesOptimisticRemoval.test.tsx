import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestJson } from '~/api/request';
import { notify } from '~/notification';
import { favoritesPageRequests } from '~/test/api-mock';
import type { FavoritesSummary } from '~/types';

import cardStyles from '../../components/ShowRowCard/ShowRowCard.module.css';
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

const label = (action: 'Remove' | 'Add', name: string) =>
  `${action} ${name} ${action === 'Remove' ? 'from' : 'to'} favorites`;
const heart = (action: 'Remove' | 'Add', name: string) =>
  screen.getByRole('button', { name: label(action, name) });
const article = (name: string) =>
  screen.getByRole('heading', { name }).closest('article');

const deferred = () => {
  let resolve!: (summary: FavoritesSummary) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<FavoritesSummary>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

describe('FavoritesPage optimistic soft removal', () => {
  beforeEach(() => {
    resetFavorites(backend);
    api.mockReset();
    stubFavoritesApi(api, backend, {
      addFavorite: backend.add,
      removeFavorite: backend.remove,
    });
  });

  afterEach(cleanup);

  it('flips the marking before the removal settles, without a refetch', async () => {
    const gate = deferred();

    await mountFavorites();
    stubFavoritesApi(api, backend, { removeFavorite: () => gate.promise });

    fireEvent.click(heart('Remove', 'Show One'));

    expect(heart('Add', 'Show One')).toBeDisabled();
    expect(article('Show One')).toHaveClass(cardStyles.removed);
    expect(notify.info).not.toHaveBeenCalled();
    expect(favoritesPageRequests(api)).toHaveLength(1);

    await act(async () => {
      gate.resolve(await backend.remove(1));
    });

    expect(heart('Add', 'Show One')).toBeEnabled();
    expect(notify.info).toHaveBeenCalledWith(
      '"Show One" was removed from favorites',
    );
    expect(favoritesPageRequests(api)).toHaveLength(1);
  });

  it('restores the grayed card before the re-add settles and rolls back', async () => {
    await mountFavorites();
    fireEvent.click(heart('Remove', 'Show One'));
    await screen.findByRole('button', { name: label('Add', 'Show One') });
    await vi.waitFor(() => expect(heart('Add', 'Show One')).toBeEnabled());

    const gate = deferred();
    stubFavoritesApi(api, backend, { addFavorite: () => gate.promise });

    fireEvent.click(heart('Add', 'Show One'));

    expect(heart('Remove', 'Show One')).toBeDisabled();
    expect(article('Show One')).not.toHaveClass(cardStyles.removed);
    expect(notify.success).not.toHaveBeenCalled();

    await act(async () => {
      gate.reject(new Error('offline'));
    });

    expect(heart('Add', 'Show One')).toBeEnabled();
    expect(article('Show One')).toHaveClass(cardStyles.removed);
    expect(notify.error).toHaveBeenCalledWith('offline');
    expect(notify.success).not.toHaveBeenCalled();
    expect(favoritesPageRequests(api)).toHaveLength(1);
  });
});
