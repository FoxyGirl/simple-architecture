import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestJson } from '~/api/request';
import { replaceSearchResult, store } from '~/store';
import { lastSearchCall, searchSelection, stubApi } from '~/test/api-mock';

import { abortShowsFetch, fetchShowsPage } from '../fetchShowsPage';

import { PAGE_OK, REQUEST, SENTINEL } from './helpers';

vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();
  return { ...actual, requestJson: vi.fn() };
});

const api = vi.mocked(requestJson);

describe('fetchShowsPage Task', () => {
  beforeEach(() => {
    api.mockReset();
    store.dispatch(replaceSearchResult(SENTINEL));
  });

  afterEach(() => {
    abortShowsFetch();
  });

  it('requests the explicit query/genre/page and stores the result', async () => {
    stubApi(api, { search: () => PAGE_OK });

    const result = await fetchShowsPage(REQUEST);

    expect(lastSearchCall(api)?.params.get('q')).toBe('office');
    expect(searchSelection(lastSearchCall(api))).toEqual({
      genre: 'Comedy',
      page: 2,
    });
    expect(result).toEqual({ status: 'success', page: PAGE_OK });
    expect(store.getState().shows).toEqual(PAGE_OK);
  });

  it('on a request failure returns an error result and dispatches nothing', async () => {
    stubApi(api, {
      search: () => {
        throw new Error('API request failed with status 500');
      },
    });

    const result = await fetchShowsPage(REQUEST);

    expect(result).toEqual({
      status: 'error',
      message: 'API request failed with status 500',
    });
    expect(store.getState().shows).toEqual(SENTINEL);
  });

  it('exposes a plain function interface — no React hooks, no other state', async () => {
    const taskModule = await import('../fetchShowsPage');

    expect(Object.keys(taskModule).sort()).toEqual([
      'abortShowsFetch',
      'fetchShowsPage',
    ]);
    expect(
      Object.values(taskModule).every((fn) => typeof fn === 'function'),
    ).toBe(true);
  });
});
