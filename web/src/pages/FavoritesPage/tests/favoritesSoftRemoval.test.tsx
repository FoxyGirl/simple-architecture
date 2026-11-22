import { cleanup, fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestJson } from '~/api/request';
import { favoritesPageRequests } from '~/test/api-mock';
import type { Show } from '~/types';

import {
  createFavoritesBackend,
  heading,
  mountFavorites,
  renderFavoritesPage,
  resetFavorites,
} from './favoritesHarness';
import { stubFavoritesApi } from './stubFavoritesApi';

vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();

  return { ...actual, requestJson: vi.fn() };
});

const api = vi.mocked(requestJson);

const backend = createFavoritesBackend();

const lastPageRequest = () => favoritesPageRequests(api).slice(-1)[0];

const label = (action: 'Remove' | 'Add', name: string) =>
  `${action} ${name} ${action === 'Remove' ? 'from' : 'to'} favorites`;
const heart = (action: 'Remove' | 'Add', name: string) =>
  screen.getByRole('button', { name: label(action, name) });
const findHeart = (action: 'Remove' | 'Add', name: string) =>
  screen.findByRole('button', { name: label(action, name) });

describe('FavoritesPage soft removal fresh fetches', () => {
  beforeEach(() => {
    resetFavorites(backend);
    api.mockReset();
    stubFavoritesApi(api, backend, {
      addFavorite: backend.add,
      removeFavorite: backend.remove,
    });
  });

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

    expect(await findHeart('Remove', 'Show One')).toBeVisible();
    expect(lastPageRequest()).toBe(1);
  });

  it('keeps every removed card listed until a fresh fetch is empty', async () => {
    await mountFavorites();

    for (const name of ['Show One', 'Show Two', 'Show Three']) {
      fireEvent.click(heart('Remove', name));
      await findHeart('Add', name);
    }

    for (const name of ['Show One', 'Show Two', 'Show Three']) {
      expect(heart('Add', name)).toBeVisible();
    }
    expect(screen.queryByText(/No favorites yet/)).toBeNull();
    expect(screen.getByText('Page 1 of 2')).toBeVisible();
    expect(favoritesPageRequests(api)).toHaveLength(1);

    await backend.remove(4);
    cleanup();
    renderFavoritesPage();

    expect(await screen.findByText(/No favorites yet/)).toBeVisible();
    expect(favoritesPageRequests(api)).toHaveLength(2);
  });
});
