import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { Show } from '@api/types';
import {
  addFavorite,
  removeFavorite,
  selectFavoriteShows,
  store,
} from '@store';

import { FavoritesPage } from '..';

const show = (id: number, name: string): Show =>
  ({ id, name, genres: ['Drama'], premiered: '2010-05-01' }) as Show;

const favoriteIds = () =>
  selectFavoriteShows(store.getState()).map((favorite) => favorite.id);

const removeButton = (name: string) => screen.getByRole('button', { name });

// The page renders inside the router the Presenter navigates with; the
// catalogue route is a stub the navigation assertion can detect.
const renderFavoritesPage = () =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/favorites']}>
        <Routes>
          <Route path="/" element={<h1>Catalogue stub</h1>} />
          <Route path="/favorites" element={<FavoritesPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );

describe('FavoritesPage', () => {
  beforeEach(() => {
    for (const id of favoriteIds()) store.dispatch(removeFavorite(id));
  });

  afterEach(cleanup);

  it('shows an empty state when nothing is favorited', () => {
    renderFavoritesPage();

    expect(screen.getByText(/No favorites yet/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
  });

  it('lists every favorited show', () => {
    store.dispatch(addFavorite(show(1, 'Show One')));
    store.dispatch(addFavorite(show(2, 'Show Two')));

    renderFavoritesPage();

    expect(
      screen.getByRole('heading', { name: 'Show One' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Show Two' }),
    ).toBeInTheDocument();
  });

  it('the heart button removes a show from the list', () => {
    store.dispatch(addFavorite(show(1, 'Show One')));

    renderFavoritesPage();
    fireEvent.click(removeButton('Remove Show One from favorites'));

    expect(favoriteIds()).toEqual([]);
    expect(
      screen.queryByRole('heading', { name: 'Show One' }),
    ).not.toBeInTheDocument();
  });

  it('the browse button navigates back to the catalogue', () => {
    renderFavoritesPage();

    fireEvent.click(screen.getByRole('button', { name: /Browse shows/ }));

    expect(
      screen.getByRole('heading', { name: 'Catalogue stub' }),
    ).toBeInTheDocument();
  });
});
