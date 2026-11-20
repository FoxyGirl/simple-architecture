import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestJson } from '~/api/request';
import { notify } from '~/notification';
import { favoritesPageRequests, stubApi } from '~/test/api-mock';

import cardStyles from '../../components/ShowRowCard/ShowRowCard.module.css';
import {
  createFavoritesBackend,
  mountFavorites,
  resetFavorites,
} from './favoritesHarness';

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
const findHeart = (action: 'Remove' | 'Add', name: string) =>
  screen.findByRole('button', { name: label(action, name) });
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const article = (name: string) =>
  screen.getByRole('heading', { name }).closest('article');

const stubPage = () =>
  stubApi(api, {
    favoritesPage: backend.fetchPage,
    addFavorite: backend.add,
    removeFavorite: backend.remove,
  });

describe('FavoritesPage failed soft removal', () => {
  beforeEach(() => {
    resetFavorites(backend);
    api.mockReset();
    stubPage();
  });

  it('keeps the card pressed when the removal fails', async () => {
    await mountFavorites();
    stubApi(api, {
      favoritesPage: backend.fetchPage,
      removeFavorite: () => {
        throw new Error('offline');
      },
    });

    fireEvent.click(heart('Remove', 'Show One'));
    await settle();

    expect(heart('Remove', 'Show One')).toBeVisible();
    expect(article('Show One')).not.toHaveClass(cardStyles.removed);
    expect(notify.error).toHaveBeenCalledWith('offline');
    expect(favoritesPageRequests(api)).toHaveLength(1);
  });

  it('keeps the card removed when the re-add fails', async () => {
    await mountFavorites();
    fireEvent.click(heart('Remove', 'Show One'));
    await findHeart('Add', 'Show One');
    stubApi(api, {
      favoritesPage: backend.fetchPage,
      addFavorite: () => {
        throw new Error('offline');
      },
    });

    fireEvent.click(heart('Add', 'Show One'));
    await settle();

    expect(heart('Add', 'Show One')).toBeVisible();
    expect(article('Show One')).toHaveClass(cardStyles.removed);
    expect(notify.error).toHaveBeenCalledWith('offline');
    expect(favoritesPageRequests(api)).toHaveLength(1);
  });
});
