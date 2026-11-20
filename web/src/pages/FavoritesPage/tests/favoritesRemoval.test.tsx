import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  addFavoriteShow,
  fetchFavoritesListPage,
  removeFavoriteShow,
} from '~/api/favorites';

import cardStyles from '../../components/ShowRowCard/ShowRowCard.module.css';
import {
  createFavoritesBackend,
  heading,
  mountFavorites,
  resetFavorites,
} from './favoritesHarness';

vi.mock('~/api/favorites', () => ({
  addFavoriteShow: vi.fn(),
  removeFavoriteShow: vi.fn(),
  fetchFavoritesCount: vi.fn(),
  fetchFavoritesListPage: vi.fn(),
}));

const backend = createFavoritesBackend();
const listMock = vi.mocked(fetchFavoritesListPage);
const removeMock = vi.mocked(removeFavoriteShow);
const addMock = vi.mocked(addFavoriteShow);
listMock.mockImplementation(backend.fetchPage);
removeMock.mockImplementation(backend.remove);
addMock.mockImplementation(backend.add);

const label = (action: 'Remove' | 'Add', name: string) =>
  `${action} ${name} ${action === 'Remove' ? 'from' : 'to'} favorites`;
const heart = (action: 'Remove' | 'Add', name: string) =>
  screen.getByRole('button', { name: label(action, name) });
const findHeart = (action: 'Remove' | 'Add', name: string) =>
  screen.findByRole('button', { name: label(action, name) });
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const article = (name: string) =>
  screen.getByRole('heading', { name }).closest('article');

describe('FavoritesPage soft removal', () => {
  beforeEach(() => resetFavorites(backend));

  it('keeps a removed card listed with an unpressed heart and no refetch', async () => {
    await mountFavorites();

    fireEvent.click(heart('Remove', 'Show One'));

    expect(await findHeart('Add', 'Show One')).toBeVisible();
    await heading('Show One');
    expect(article('Show One')).toHaveClass(cardStyles.removed);
    expect(screen.getByText('4 shows saved to your list.')).toBeVisible();
    expect(screen.getByText('Page 1 of 2')).toBeVisible();
    expect(removeMock).toHaveBeenCalledWith(1);
    expect(listMock).toHaveBeenCalledTimes(1);
  });

  it('restores a pressed heart in place when a removed show is re-added', async () => {
    await mountFavorites();
    fireEvent.click(heart('Remove', 'Show One'));
    await findHeart('Add', 'Show One');

    fireEvent.click(heart('Add', 'Show One'));

    expect(await findHeart('Remove', 'Show One')).toBeVisible();
    expect(article('Show One')).not.toHaveClass(cardStyles.removed);
    expect(addMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, name: 'Show One' }),
    );
    expect(screen.getByText('4 shows saved to your list.')).toBeVisible();
    expect(listMock).toHaveBeenCalledTimes(1);
  });

  it('keeps the card pressed when the removal fails', async () => {
    await mountFavorites();
    removeMock.mockRejectedValueOnce(new Error('offline'));

    fireEvent.click(heart('Remove', 'Show One'));
    await settle();

    expect(heart('Remove', 'Show One')).toBeVisible();
    expect(article('Show One')).not.toHaveClass(cardStyles.removed);
    expect(listMock).toHaveBeenCalledTimes(1);
  });

  it('keeps the card removed when the re-add fails', async () => {
    await mountFavorites();
    fireEvent.click(heart('Remove', 'Show One'));
    await findHeart('Add', 'Show One');
    addMock.mockRejectedValueOnce(new Error('offline'));

    fireEvent.click(heart('Add', 'Show One'));
    await settle();

    expect(heart('Add', 'Show One')).toBeVisible();
    expect(article('Show One')).toHaveClass(cardStyles.removed);
    expect(listMock).toHaveBeenCalledTimes(1);
  });
});
