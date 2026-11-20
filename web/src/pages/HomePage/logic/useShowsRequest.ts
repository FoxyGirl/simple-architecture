import { useCallback, useRef } from 'react';

import type { SearchChange, SearchRequest, ShowsFetchResult } from '../types';

import { STATUS } from '../constants';
import { sessionOf } from './searchSession';
import { saveSearchSession } from './tasks/saveSearchSession';
import { abortShowsFetch, fetchShowsPage } from './tasks/fetchShowsPage';

/**
 * The Task-invocation coordination owned by the page presenter: every run
 * remembers its request — genre/page selections and retries build on it —
 * and reports the Task's outcome as presentation status. A superseded
 * (aborted) run reports nothing; the newer request owns the screen. A
 * successful run also persists the search session, so an in-session HomePage
 * remount restores exactly the result on screen.
 */
export const useShowsRequest = (
  onSearchChange: (change: SearchChange) => void,
  initialRequest: SearchRequest | null = null,
) => {
  const requestRef = useRef<SearchRequest | null>(initialRequest);

  const runRequest = useCallback(
    async (request: SearchRequest): Promise<ShowsFetchResult> => {
      requestRef.current = request;
      onSearchChange({ status: STATUS.LOADING, queryEcho: request.query });

      const result = await fetchShowsPage(request);
      if (result.status === 'aborted') return result;

      if (result.status === 'success') {
        saveSearchSession(sessionOf(request, result.page.page));
      }

      onSearchChange({
        status: result.status === 'success' ? STATUS.SUCCESS : STATUS.ERROR,
      });

      return result;
    },
    [onSearchChange],
  );

  // Retry re-issues the current q/genre/page request as it stands.
  const retry = useCallback(() => {
    const current = requestRef.current;
    if (current) void runRequest(current);
  }, [runRequest]);

  // Discarding a search aborts through the Task layer, never directly.
  const abortSearch = useCallback(() => abortShowsFetch(), []);

  return { runRequest, retry, abortSearch, requestRef };
};
