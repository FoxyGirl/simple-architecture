import { useCallback, useRef, useState } from 'react';

import type { SearchRequest, ShowsFetchResult } from '../types';

import { STATUS, type SearchStatus } from '../constants';

import { abortShowsFetch, fetchShowsPage } from './tasks/fetchShowsPage';
import { isSameRequest } from './urlState';

export type RunShowsRequestOptions = {
  onGenreUnavailable?: () => void;
};

/**
 * The Task-invocation coordination owned by the page presenter: every run
 * remembers its request — genre/page selections and retries build on it —
 * and owns the request status plus error message the page derives its
 * presentation from. The hook is the only writer of that status; a
 * superseded (aborted) run reports nothing, the newer run owns the screen.
 * The coordination stays private: `runRequest` dedupes identical requests
 * (resolving `null`), `onGenreUnavailable` reports a missing genre, `retry`
 * bypasses the dedupe.
 */
export const useShowsRequest = (initialStatus: SearchStatus) => {
  const requestRef = useRef<SearchRequest | null>(null);
  // The query whose payload the Entity currently holds; the page compares a
  // pending query against it to decide how much of the screen to skeleton.
  const [lastSuccessQuery, setLastSuccessQuery] = useState<string | null>(null);
  const [status, setStatus] = useState<SearchStatus>(initialStatus);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const execute = useCallback(
    async (
      request: SearchRequest,
      options?: RunShowsRequestOptions,
    ): Promise<ShowsFetchResult> => {
      requestRef.current = request;
      setStatus(STATUS.LOADING);
      setErrorMessage(null);

      const result = await fetchShowsPage(request);

      // A superseded run leaves the status to the newer one in flight.
      if (result.status === 'aborted') return result;

      if (result.status === 'error') {
        setStatus(STATUS.ERROR);
        setErrorMessage(result.message);

        return result;
      }

      setLastSuccessQuery(request.query);
      setStatus(STATUS.SUCCESS);

      // An unavailable genre is reported only while this run owns the screen.
      if (
        request.genre &&
        !result.page.genres.includes(request.genre) &&
        requestRef.current === request
      ) {
        options?.onGenreUnavailable?.();
      }

      return result;
    },
    [],
  );

  // The URL-driven entry point: a request identical to the last run is deduped.
  const runRequest = useCallback(
    (
      request: SearchRequest,
      options?: RunShowsRequestOptions,
    ): Promise<ShowsFetchResult | null> =>
      isSameRequest(requestRef.current, request)
        ? Promise.resolve(null)
        : execute(request, options),
    [execute],
  );

  // Retry re-issues the current request past the dedupe: a failed run repeats.
  const retry = () => {
    const current = requestRef.current;
    if (current) void execute(current);
  };

  // Discarding a search aborts through the Task layer, never directly. The
  // aborted request never completed, so it must not dedupe its re-issue.
  const abortSearch = useCallback(() => {
    abortShowsFetch();
    requestRef.current = null;
  }, []);

  return {
    runRequest,
    retry,
    abortSearch,
    lastSuccessQuery,
    status,
    errorMessage,
  };
};
