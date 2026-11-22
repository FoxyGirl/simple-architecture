import { act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestJson } from '~/api/request';
import { notify } from '~/notification';
import {
  replaceFavoritesSummary,
  selectPendingFavoriteIds,
  store,
} from '~/store';
import { stubApi } from '~/test/api-mock';

import { click, page1 } from '../../../test/home-flow';
import {
  countButton,
  deferredSummary,
  emptySummary,
  favoriteButton,
  searchAsGuest,
} from './optimisticHarness';

// The rollback half of the optimistic toggle: a write that fails after the
// UI already flipped restores the pre-click heart and count, reports the
// failure through the existing error toast and never toasts a success.
vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();
  return { ...actual, requestJson: vi.fn() };
});
vi.mock('~/notification', () => ({
  notify: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

const api = vi.mocked(requestJson);

describe('HomePage optimistic toggle rollback', () => {
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

  it('rolls the optimistic state back when the write fails', async () => {
    const gate = deferredSummary();
    stubApi(api, { search: () => page1, addFavorite: () => gate.promise });
    await searchAsGuest();

    await click(favoriteButton('Add Show One to favorites'));
    expect(
      favoriteButton('Remove Show One from favorites'),
    ).toBeInTheDocument();
    expect(countButton(1)).toBeInTheDocument();

    await act(async () => {
      gate.reject(new Error('offline'));
    });

    expect(favoriteButton('Add Show One to favorites')).toBeInTheDocument();
    expect(countButton(0)).toBeInTheDocument();
    expect(notify.error).toHaveBeenCalledWith('offline');
    expect(notify.success).not.toHaveBeenCalled();
    expect(selectPendingFavoriteIds(store.getState())).toEqual([]);
  });
});
