import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestJson } from '~/api/request';
import { favoriteWrites, favoritesPageRequests } from '~/test/api-mock';

import cardStyles from '../../components/ShowRowCard/ShowRowCard.module.css';
import {
  createFavoritesBackend,
  heading,
  mountFavorites,
  resetFavorites,
} from './favoritesHarness';
import { stubFavoritesApi } from './stubFavoritesApi';

vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();
  return { ...actual, requestJson: vi.fn() };
});

const api = vi.mocked(requestJson);

const backend = createFavoritesBackend();

const label = (action: 'Remove' | 'Add', name: string) =>
  `${action} ${name} ${action === 'Remove' ? 'from' : 'to'} favorites`;
const heart = (action: 'Remove' | 'Add', name: string) =>
  screen.getByRole('button', { name: label(action, name) });
const findHeart = (action: 'Remove' | 'Add', name: string) =>
  screen.findByRole('button', { name: label(action, name) });
const article = (name: string) =>
  screen.getByRole('heading', { name }).closest('article');

describe('FavoritesPage soft removal', () => {
  beforeEach(() => {
    resetFavorites(backend);
    api.mockReset();
    stubFavoritesApi(api, backend, {
      addFavorite: backend.add,
      removeFavorite: backend.remove,
    });
  });

  it('keeps a removed card listed with an unpressed heart and no refetch', async () => {
    await mountFavorites();

    fireEvent.click(heart('Remove', 'Show One'));

    expect(await findHeart('Add', 'Show One')).toBeVisible();
    await heading('Show One');
    expect(article('Show One')).toHaveClass(cardStyles.removed);
    expect(screen.getByText('3 shows saved to your list.')).toBeVisible();
    expect(screen.getByText('Page 1 of 2')).toBeVisible();
    expect(favoriteWrites(api)).toContainEqual(
      expect.objectContaining({ path: '/api/favorites/1', method: 'DELETE' }),
    );
    expect(favoritesPageRequests(api)).toHaveLength(1);
  });

  it('restores a pressed heart in place when a removed show is re-added', async () => {
    await mountFavorites();
    fireEvent.click(heart('Remove', 'Show One'));
    await findHeart('Add', 'Show One');

    fireEvent.click(heart('Add', 'Show One'));

    expect(await findHeart('Remove', 'Show One')).toBeVisible();
    expect(article('Show One')).not.toHaveClass(cardStyles.removed);
    expect(favoriteWrites(api)).toContainEqual(
      expect.objectContaining({
        path: '/api/favorites',
        method: 'POST',
        body: {
          show: expect.objectContaining({ id: 1, name: 'Show One' }),
        },
      }),
    );
    expect(screen.getByText('4 shows saved to your list.')).toBeVisible();
    expect(favoritesPageRequests(api)).toHaveLength(1);
  });
});
