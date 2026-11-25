import { act, fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestJson } from '~/api/request';
import type { FavoritesListPage } from '~/types';

import skeletonStyles from '../../components/SkeletonCards/SkeletonCards.module.css';
import {
  button,
  createFavoritesBackend,
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

// A favorites backend whose page responses resolve only when the suite says
// so, mirroring the deferred search harness of the HomePage suites.
const pending: Array<() => void> = [];

const stubDeferredPages = () => {
  stubFavoritesApi(api, backend, {
    favoritesPage: (page) =>
      new Promise<FavoritesListPage>((resolve) => {
        pending.push(() => resolve(backend.fetchPage(page)));
      }),
  });
};

const resolveNextPage = async () => {
  const settle = pending.shift();

  if (!settle) throw new Error('No pending favorites page to resolve.');

  await act(async () => {
    settle();
  });
};

const skeletonCards = (container: HTMLElement) =>
  container.querySelectorAll(`.${skeletonStyles.list} > *`);

describe('FavoritesPage loading', () => {
  beforeEach(() => {
    pending.length = 0;
    resetFavorites(backend);
    api.mockReset();
    stubDeferredPages();
  });

  it('shows skeleton cards while the first page loads', async () => {
    const { container } = renderFavoritesPage();

    expect(
      screen.getByRole('heading', { name: 'Favorites' }),
    ).toBeInTheDocument();
    expect(skeletonCards(container)).toHaveLength(3);
    expect(screen.queryByRole('heading', { name: 'Show One' })).toBeNull();
    expect(screen.queryByText(/No favorites yet/)).toBeNull();

    await resolveNextPage();

    expect(
      await screen.findByRole('heading', { name: 'Show One' }),
    ).toBeInTheDocument();
    expect(skeletonCards(container)).toHaveLength(0);
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });

  it('a page change replaces the cards with skeletons and keeps the pagination', async () => {
    const { container } = renderFavoritesPage();
    await resolveNextPage();
    expect(
      await screen.findByRole('heading', { name: 'Show One' }),
    ).toBeInTheDocument();

    fireEvent.click(button('Next page'));

    // The stored page keeps the frame: the selected page shows immediately,
    // while the cards of the previous page are gone.
    expect(skeletonCards(container)).toHaveLength(3);
    expect(screen.queryByRole('heading', { name: 'Show One' })).toBeNull();
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();

    await resolveNextPage();

    expect(
      await screen.findByRole('heading', { name: 'Show Four' }),
    ).toBeInTheDocument();
    expect(skeletonCards(container)).toHaveLength(0);
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
  });

  it('does not render the empty state until the fetch lands', async () => {
    backend.clear();
    renderFavoritesPage();

    expect(screen.queryByText(/No favorites yet/)).toBeNull();

    await resolveNextPage();

    expect(await screen.findByText(/No favorites yet/)).toBeInTheDocument();
  });
});
