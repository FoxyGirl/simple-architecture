import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestJson } from '~/api/request';
import { notify } from '~/notification';
import { replaceFavoritesSummary, store } from '~/store';
import { stubApi } from '~/test/api-mock';

import {
  click,
  page1,
  renderHomePage,
  settle,
  typeQuery,
} from '../../../test/home-flow';

// The toasts follow the results the mocked request boundary resolves with.
vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();

  return { ...actual, requestJson: vi.fn() };
});
// The notification boundary: the suite asserts the presenter calls the
// library-independent notify API — Sonner itself never renders here, and
// its auto-dismiss behavior is asserted in the E2E spec instead.
vi.mock('~/notification', () => ({
  notify: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

const api = vi.mocked(requestJson);

const favoriteButton = (name: string) => screen.getByRole('button', { name });

const emptySummary = { count: 0, ids: [] };

// Renders the page, searches and settles the debounce — the cards appear
// with the summaries the mocks resolve with at that moment.
const searchAsGuest = async () => {
  renderHomePage();
  typeQuery('office');
  await settle();
};

describe('HomePage favorites toasts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    store.dispatch(replaceFavoritesSummary(emptySummary));
    vi.mocked(notify.success).mockClear();
    vi.mocked(notify.info).mockClear();
    vi.mocked(notify.error).mockClear();
    api.mockReset();
    stubApi(api, {
      search: () => page1,
      favoritesCount: () => emptySummary,
      addFavorite: () => ({ count: 1, ids: [1] }),
      removeFavorite: () => emptySummary,
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('a successful add toasts the addition message', async () => {
    await searchAsGuest();

    await click(favoriteButton('Add Show One to favorites'));

    expect(notify.success).toHaveBeenCalledWith(
      '"Show One" was added to favorites',
    );
  });

  it('a successful removal toasts the distinct removal message', async () => {
    await searchAsGuest();
    await click(favoriteButton('Add Show One to favorites'));

    await click(favoriteButton('Remove Show One from favorites'));

    expect(notify.info).toHaveBeenCalledWith(
      '"Show One" was removed from favorites',
    );
  });

  it('a failed toggle shows the error notification', async () => {
    await searchAsGuest();
    stubApi(api, {
      search: () => page1,
      addFavorite: () => {
        throw new Error('offline');
      },
    });

    await click(favoriteButton('Add Show One to favorites'));

    expect(notify.error).toHaveBeenCalledWith('offline');
    expect(notify.success).not.toHaveBeenCalled();
    expect(notify.info).not.toHaveBeenCalled();
  });
});
