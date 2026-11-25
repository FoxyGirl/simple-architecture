import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestJson } from '~/api/request';
import { replaceSearchResult, store } from '~/store';
import { lastSearchCall, stubApi } from '~/test/api-mock';

import { abortShowsFetch, fetchShowsPage } from '../fetchShowsPage';

import {
  PAGE_NEWER,
  PAGE_OK,
  REQUEST,
  SENTINEL,
  abortError,
  deferred,
} from './helpers';

vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();
  return { ...actual, requestJson: vi.fn() };
});

const api = vi.mocked(requestJson);

describe('fetchShowsPage Task cancellation', () => {
  beforeEach(() => {
    api.mockReset();
    store.dispatch(replaceSearchResult(SENTINEL));
  });

  afterEach(() => {
    abortShowsFetch();
  });

  it('a newer run aborts the superseded request and only its data reaches the store', async () => {
    const older = deferred();
    const newer = deferred();
    const signals: AbortSignal[] = [];

    stubApi(api, {
      search: (call) => {
        if (call.signal) signals.push(call.signal);
        return signals.length === 1 ? older.promise : newer.promise;
      },
    });

    const runOlder = fetchShowsPage(REQUEST);
    const runNewer = fetchShowsPage({ ...REQUEST, query: 'friends' });

    expect(signals[0]?.aborted).toBe(true);

    older.reject(abortError());
    newer.resolve(PAGE_NEWER);

    await expect(runOlder).resolves.toEqual({ status: 'aborted' });
    expect(await runNewer).toEqual({ status: 'success', page: PAGE_NEWER });
    expect(store.getState().shows).toEqual(PAGE_NEWER);
  });

  it('an aborted run settles as aborted and leaves the store untouched', async () => {
    stubApi(api, {
      search: (call) =>
        new Promise((_, reject) => {
          call.signal?.addEventListener('abort', () => reject(abortError()));
        }),
    });

    const run = fetchShowsPage(REQUEST);
    expect(lastSearchCall(api)?.signal?.aborted).toBe(false);

    abortShowsFetch();

    await expect(run).resolves.toEqual({ status: 'aborted' });
    expect(store.getState().shows).toEqual(SENTINEL);
  });

  it('a response that resolves after its request was aborted never dispatches', async () => {
    const pending = deferred();
    stubApi(api, { search: () => pending.promise });

    const run = fetchShowsPage(REQUEST);
    abortShowsFetch();
    pending.resolve(PAGE_OK);

    await expect(run).resolves.toEqual({ status: 'aborted' });
    expect(store.getState().shows).toEqual(SENTINEL);
  });
});
