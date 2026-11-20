import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { searchShowsPage } from '~/api/shows';
import { replaceSearchResult, store } from '~/store';

import { abortShowsFetch, fetchShowsPage } from '../fetchShowsPage';

import {
  PAGE_NEWER,
  PAGE_OK,
  REQUEST,
  SENTINEL,
  abortError,
  deferred,
} from './helpers';

vi.mock('~/api/shows', () => ({ searchShowsPage: vi.fn() }));

const mocked = vi.mocked(searchShowsPage);

describe('fetchShowsPage Task', () => {
  beforeEach(() => {
    mocked.mockReset();
    store.dispatch(replaceSearchResult(SENTINEL));
  });

  afterEach(() => {
    abortShowsFetch();
  });

  it('fetches with the explicit query/genre/page arguments and stores the result', async () => {
    mocked.mockResolvedValueOnce(PAGE_OK);

    const result = await fetchShowsPage(REQUEST);

    expect(mocked).toHaveBeenCalledWith(
      'office',
      { genre: 'Comedy', page: 2 },
      { signal: expect.any(AbortSignal) },
    );
    expect(result).toEqual({ status: 'success', page: PAGE_OK });
    expect(store.getState().shows).toEqual(PAGE_OK);
  });

  it('on an API failure returns an error result and dispatches nothing', async () => {
    mocked.mockRejectedValueOnce(
      new Error('API request failed with status 500'),
    );

    const result = await fetchShowsPage(REQUEST);

    expect(result).toEqual({ status: 'error' });
    expect(store.getState().shows).toEqual(SENTINEL);
  });

  it('a newer run aborts the superseded request and only its data reaches the store', async () => {
    const older = deferred();
    const newer = deferred();
    mocked
      .mockReturnValueOnce(older.promise)
      .mockReturnValueOnce(newer.promise);

    const runOlder = fetchShowsPage(REQUEST);
    const runNewer = fetchShowsPage({ ...REQUEST, query: 'friends' });

    expect(mocked.mock.calls[0]?.[2]?.signal?.aborted).toBe(true);

    older.reject(abortError());
    newer.resolve(PAGE_NEWER);

    await expect(runOlder).resolves.toEqual({ status: 'aborted' });
    expect(await runNewer).toEqual({ status: 'success', page: PAGE_NEWER });
    expect(store.getState().shows).toEqual(PAGE_NEWER);
  });

  it('an aborted run settles as aborted and leaves the store untouched', async () => {
    mocked.mockImplementationOnce((_query, _selection, options) => {
      const signal = options?.signal;
      return new Promise((_, reject) => {
        signal?.addEventListener('abort', () => reject(abortError()));
      });
    });

    const run = fetchShowsPage(REQUEST);
    expect(mocked.mock.calls[0]?.[2]?.signal?.aborted).toBe(false);

    abortShowsFetch();

    await expect(run).resolves.toEqual({ status: 'aborted' });
    expect(store.getState().shows).toEqual(SENTINEL);
  });

  it('a response that resolves after its request was aborted never dispatches', async () => {
    const pending = deferred();
    mocked.mockReturnValueOnce(pending.promise);

    const run = fetchShowsPage(REQUEST);
    abortShowsFetch();
    pending.resolve(PAGE_OK);

    await expect(run).resolves.toEqual({ status: 'aborted' });
    expect(store.getState().shows).toEqual(SENTINEL);
  });

  it('exposes a plain function interface — no React hooks, no other state', async () => {
    const taskModule = await import('../fetchShowsPage');

    expect(Object.keys(taskModule).sort()).toEqual([
      'abortShowsFetch',
      'fetchShowsPage',
    ]);
    const functions = Object.values(taskModule);
    expect(functions.every((fn) => typeof fn === 'function')).toBe(true);

    abortShowsFetch();
  });
});
