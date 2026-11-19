import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { searchShowsPage } from '@api/shows';
import { removeFavorite, selectFavoriteShows, store } from '@store';

import {
  click,
  page1,
  renderHomePage,
  settle,
  typeQuery,
} from '../../../test/home-flow';

vi.mock('@api/shows', () => ({ searchShowsPage: vi.fn() }));

const favoriteButton = (name: string) => screen.getByRole('button', { name });

const favoriteIds = () =>
  selectFavoriteShows(store.getState()).map((favorite) => favorite.id);

describe('HomePage favorites flow', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    for (const id of favoriteIds()) store.dispatch(removeFavorite(id));
    vi.mocked(searchShowsPage).mockReset().mockResolvedValue(page1);
    renderHomePage();
    typeQuery('office');
    await settle();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('every result card offers a favorite button', () => {
    expect(favoriteButton('Add Show One to favorites')).toBeInTheDocument();
    expect(favoriteButton('Add Show Two to favorites')).toBeInTheDocument();
  });

  it('clicking the button adds the show to the favorites entity', async () => {
    await click(favoriteButton('Add Show One to favorites'));

    expect(favoriteIds()).toEqual([1]);
  });

  it('a favorited card shows the pressed remove button', async () => {
    await click(favoriteButton('Add Show One to favorites'));

    const remove = favoriteButton('Remove Show One from favorites');
    expect(remove).toHaveAttribute('aria-pressed', 'true');
  });

  it('clicking the pressed button removes the show again', async () => {
    await click(favoriteButton('Add Show One to favorites'));

    await click(favoriteButton('Remove Show One from favorites'));

    expect(favoriteIds()).toEqual([]);
  });
});
