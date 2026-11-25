import { act, cleanup, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestJson } from '~/api/request';
import { notify } from '~/notification';
import {
  replaceFavoritesSummary,
  selectFavoriteIds,
  selectPendingFavoriteIds,
  store,
} from '~/store';
import { favoriteWrites, stubApi } from '~/test/api-mock';

import { click, page1 } from '../../../test/home-flow';
import {
  countButton,
  deferredSummary,
  emptySummary,
  favoriteButton,
  searchAsGuest,
} from './optimisticHarness';

// The optimistic window is driven by write responses that never settle until
// the test opens the gate — the UI must already show the new state before,
// and the success toast must not appear before the confirmation.
vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();
  return { ...actual, requestJson: vi.fn() };
});
vi.mock('~/notification', () => ({
  notify: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

const api = vi.mocked(requestJson);

describe('HomePage optimistic favorites toggle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    store.dispatch(replaceFavoritesSummary(emptySummary));
    api.mockReset();
    vi.mocked(notify.success).mockClear();
    vi.mocked(notify.info).mockClear();
    vi.mocked(notify.error).mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('flips the heart and the count before the add response arrives', async () => {
    const gate = deferredSummary();
    stubApi(api, { search: () => page1, addFavorite: () => gate.promise });
    await searchAsGuest();

    await click(favoriteButton('Add Show One to favorites'));

    expect(
      favoriteButton('Remove Show One from favorites'),
    ).toBeInTheDocument();
    expect(countButton(1)).toBeInTheDocument();
    expect(selectPendingFavoriteIds(store.getState())).toEqual([1]);
    expect(notify.success).not.toHaveBeenCalled();

    const heart = favoriteButton('Remove Show One from favorites');

    expect(heart).toBeDisabled();
    fireEvent.click(heart);
    expect(favoriteWrites(api)).toHaveLength(1);

    await act(async () => {
      gate.resolve({ count: 1, ids: [1] });
    });

    expect(notify.success).toHaveBeenCalledWith(
      '"Show One" was added to favorites',
    );
    expect(favoriteButton('Remove Show One from favorites')).toBeEnabled();
    expect(selectFavoriteIds(store.getState())).toEqual([1]);
    expect(selectPendingFavoriteIds(store.getState())).toEqual([]);
    expect(favoriteWrites(api)).toEqual([
      expect.objectContaining({ path: '/api/favorites', method: 'POST' }),
    ]);
  });

  it('flips the heart and the count before the removal response arrives', async () => {
    const gate = deferredSummary();
    stubApi(api, {
      search: () => page1,
      favoritesCount: () => ({ count: 1, ids: [1] }),
      removeFavorite: () => gate.promise,
    });
    await searchAsGuest();

    await click(favoriteButton('Remove Show One from favorites'));

    expect(favoriteButton('Add Show One to favorites')).toBeInTheDocument();
    expect(countButton(0)).toBeInTheDocument();
    expect(favoriteButton('Add Show One to favorites')).toBeDisabled();
    expect(notify.info).not.toHaveBeenCalled();

    await act(async () => {
      gate.resolve(emptySummary);
    });

    expect(notify.info).toHaveBeenCalledWith(
      '"Show One" was removed from favorites',
    );
    expect(favoriteButton('Add Show One to favorites')).toBeEnabled();
    expect(selectFavoriteIds(store.getState())).toEqual([]);
    expect(selectPendingFavoriteIds(store.getState())).toEqual([]);
  });
});
