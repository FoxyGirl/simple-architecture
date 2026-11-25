import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestJson } from '~/api/request';
import { favoritesPageRequests } from '~/test/api-mock';

import {
  button,
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

describe('FavoritesPage', () => {
  beforeEach(() => {
    resetFavorites(backend);
    api.mockReset();
    stubFavoritesApi(api, backend);
  });

  it('fetches the first backend page and lists three shows per page', async () => {
    await mountFavorites('Show Three');
    expect(favoritesPageRequests(api)).toEqual([1]);
    expect(screen.queryByRole('heading', { name: 'Show Four' })).toBeNull();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('4 shows saved to your list.')).toBeInTheDocument();
  });

  it('keeps the empty state with its actions when nothing is favorited', async () => {
    backend.clear();
    renderFavoritesPage();

    expect(await screen.findByText(/No favorites yet/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
    expect(button('Back to Home')).toBeInTheDocument();

    fireEvent.click(button('Browse shows'));
    expect(await heading('Home stub')).toBeTruthy();
  });

  it('the back button navigates to the catalogue', async () => {
    await mountFavorites();

    fireEvent.click(button('Back to Home'));
    expect(await heading('Home stub')).toBeTruthy();
  });
});
