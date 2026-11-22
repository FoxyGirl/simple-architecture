import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestJson } from '~/api/request';
import { searchCalls, stubApi } from '~/test/api-mock';
import type { SearchPage } from '~/types';

import type { SearchRequest } from '../types';

import { STATUS } from '../constants';
import {
  useShowsRequest,
  type RunShowsRequestOptions,
} from '../logic/useShowsRequest';

vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();
  return { ...actual, requestJson: vi.fn() };
});

const api = vi.mocked(requestJson);

const page = (genres: string[]): SearchPage => ({
  shows: [],
  page: 1,
  pageCount: 1,
  totalCount: 0,
  genres,
});

const office: SearchRequest = { query: 'office', genre: undefined, page: 1 };
const horror: SearchRequest = { query: 'office', genre: 'Horror', page: 1 };

describe('useShowsRequest', () => {
  beforeEach(() => {
    api.mockReset();
    stubApi(api, { search: () => page(['Comedy', 'Drama']) });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const render = () => renderHook(() => useShowsRequest(STATUS.IDLE));

  const run = (
    result: { current: ReturnType<typeof useShowsRequest> },
    request: SearchRequest,
    options?: RunShowsRequestOptions,
  ) => act(() => result.current.runRequest(request, options));

  it('runs the request through the Task and reports success', async () => {
    const { result } = render();

    const outcome = await run(result, office);

    expect(outcome?.status).toBe('success');
    expect(result.current.status).toBe(STATUS.SUCCESS);
    expect(result.current.lastSuccessQuery).toBe('office');
    expect(searchCalls(api)).toHaveLength(1);
  });

  it('dedupes an identical request against the last run', async () => {
    const { result } = render();

    await run(result, office);
    const deduped = await run(result, { ...office });

    expect(deduped).toBeNull();
    expect(searchCalls(api)).toHaveLength(1);
  });

  it('reports a genre the fetched page does not carry', async () => {
    const { result } = render();
    const onGenreUnavailable = vi.fn();

    await run(result, horror, { onGenreUnavailable });

    expect(onGenreUnavailable).toHaveBeenCalledTimes(1);
  });

  it('stays silent when the fetched page carries the genre', async () => {
    stubApi(api, { search: () => page(['Horror']) });
    const { result } = render();
    const onGenreUnavailable = vi.fn();

    await run(result, horror, { onGenreUnavailable });

    expect(onGenreUnavailable).not.toHaveBeenCalled();
  });

  it('retry re-issues the request the dedupe would skip', async () => {
    const { result } = render();

    await run(result, office);
    await act(async () => {
      result.current.retry();
    });

    expect(searchCalls(api)).toHaveLength(2);
    expect(result.current.status).toBe(STATUS.SUCCESS);
  });

  it('does not dedupe a re-issue after the search was discarded', async () => {
    const { result } = render();

    await run(result, office);
    act(() => result.current.abortSearch());
    await run(result, { ...office });

    expect(searchCalls(api)).toHaveLength(2);
  });
});
