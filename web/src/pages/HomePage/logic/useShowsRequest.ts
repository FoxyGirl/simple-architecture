import { useCallback, useRef, useState } from 'react';

import type { SearchRequest, ShowsFetchResult } from '../types';

import { STATUS, type SearchStatus } from '../constants';
import { abortShowsFetch, fetchShowsPage } from './tasks/fetchShowsPage';

/**
 * The Task-invocation coordination owned by the page presenter: every run
 * remembers its request — genre/page selections and retries build on it —
 * and owns the request status plus error message the page derives its
 * presentation from. The hook is the only writer of that status; a
 * superseded (aborted) run reports nothing, the newer run owns the screen.
 */
export const useShowsRequest = (initialStatus: SearchStatus) => {
  const requestRef = useRef<SearchRequest | null>(null);
  // The query whose payload the Entity currently holds; the page compares a
  // pending query against it to decide how much of the screen to skeleton.
  const [lastSuccessQuery, setLastSuccessQuery] = useState<string | null>(null);
  const [status, setStatus] = useState<SearchStatus>(initialStatus);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runRequest = useCallback(
    async (request: SearchRequest): Promise<ShowsFetchResult> => {
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

      return result;
    },
    [],
  );

  // Retry re-issues the current q/genre/page request as it stands.
  const retry = () => {
    const current = requestRef.current;
    if (current) void runRequest(current);
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
    requestRef,
    lastSuccessQuery,
    status,
    errorMessage,
  };
};
