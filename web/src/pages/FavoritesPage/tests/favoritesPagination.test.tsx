import { cleanup, fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestJson } from '~/api/request';
import { favoritesPageRequests, stubApi } from '~/test/api-mock';

import {
  button,
  createFavoritesBackend,
  location,
  mountFavorites,
  navigationType,
  resetFavorites,
} from './favoritesHarness';

vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();

  return { ...actual, requestJson: vi.fn() };
});

const api = vi.mocked(requestJson);

const backend = createFavoritesBackend();

const lastPageRequest = () => favoritesPageRequests(api).slice(-1)[0];

describe('FavoritesPage URL pagination', () => {
  beforeEach(() => {
    resetFavorites(backend);
    api.mockReset();
    stubApi(api, { favoritesPage: backend.fetchPage });
  });

  it('reads the list page from the URL on mount', async () => {
    await mountFavorites('Show Four', ['/favorites?page=2']);

    expect(lastPageRequest()).toBe(2);
    expect(location()).toBe('/favorites?page=2');
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
  });

  it('invalid page values fetch page 1', async () => {
    await mountFavorites('Show One', ['/favorites?page=abc']);
    expect(lastPageRequest()).toBe(1);

    cleanup();
    vi.clearAllMocks();
    await mountFavorites('Show One', ['/favorites?page=0']);
    expect(lastPageRequest()).toBe(1);
  });

  it('page changes write the URL page with push history', async () => {
    await mountFavorites();

    fireEvent.click(button('Next page'));
    await screen.findByRole('heading', { name: 'Show Four' });
    expect(location()).toBe('/favorites?page=2');
    expect(navigationType()).toBe('PUSH');
    expect(lastPageRequest()).toBe(2);

    fireEvent.click(button('Previous page'));
    await screen.findByRole('heading', { name: 'Show One' });
    expect(location()).toBe('/favorites');
    expect(lastPageRequest()).toBe(1);
  });

  it('Back to Home returns to the Home URL remembered by the entry', async () => {
    const state = { fromHome: '/?search=space&page=2' };
    await mountFavorites('Show One', [{ pathname: '/favorites', state }]);

    fireEvent.click(button('Next page'));
    await screen.findByRole('heading', { name: 'Show Four' });
    fireEvent.click(button('Back to Home'));

    expect(
      await screen.findByRole('heading', { name: 'Home stub' }),
    ).toBeTruthy();
    expect(location()).toBe('/?search=space&page=2');
  });
});
