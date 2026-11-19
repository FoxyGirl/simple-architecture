import { act, cleanup, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchFavoritesCount } from '@api/favorites';
import { replaceFavoritesSummary, store } from '@store';

import { HomePage } from '../HomePage';

import { click, renderHomePage, settle } from '../../../test/home-flow';

// The count button reads the backend summary the Entity mirrors. Both
// boundary mocks are declared in this file — vi.mock only hoists inside
// suites, never inside the shared helper.
vi.mock('@api/shows', () => ({ searchShowsPage: vi.fn() }));
vi.mock('@api/favorites', () => ({
  addFavoriteShow: vi.fn(),
  removeFavoriteShow: vi.fn(),
  fetchFavoritesCount: vi.fn(),
  fetchFavoritesListPage: vi.fn(),
}));

const countButton = (count: number) =>
  screen.getByRole('button', { name: `View favorites (${count})` });

// A route stub proves the presenter-driven navigation: the HomePage route
// unmounts and the favorites stub renders in its place.
const renderWithFavoritesStub = () =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/favorites" element={<p>Favorites route</p>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );

describe('HomePage favorites count button', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    store.dispatch(replaceFavoritesSummary({ count: 0, ids: [] }));
    vi.mocked(fetchFavoritesCount)
      .mockReset()
      .mockResolvedValue({ count: 2, ids: [1, 2] });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('renders the backend-synced count on mount', async () => {
    renderHomePage();
    await settle();

    expect(countButton(2)).toBeVisible();
  });

  it('updates the count when a summary is dispatched', async () => {
    renderHomePage();
    await settle();

    await act(async () => {
      store.dispatch(
        replaceFavoritesSummary({ count: 5, ids: [1, 2, 3, 4, 5] }),
      );
    });

    expect(countButton(5)).toBeVisible();
  });

  it('clicking the button navigates to the favorites route', async () => {
    renderWithFavoritesStub();
    await settle();

    await click(countButton(2));

    expect(screen.getByText('Favorites route')).toBeVisible();
  });
});
