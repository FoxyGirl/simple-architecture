import { useCallback, useRef } from 'react';

import type { SearchChange, SearchRequest } from '../types';

import { STATUS } from '../constants';
import { abortShowsFetch, fetchShowsPage } from './tasks/fetchShowsPage';

/**
 * The Task-invocation coordination owned by the page presenter: every run
 * remembers its request — genre/page selections, retries and the search-field
 * deduplication build on it — and reports the Task's outcome as presentation
 * status. A superseded (aborted) run reports nothing; the newer request owns
 * the screen.
 */
export const useShowsRequest = (
  onSearchChange: (change: SearchChange) => void,
) => {
  const requestRef = useRef<SearchRequest | null>(null);

  const runRequest = useCallback(
    async (request: SearchRequest) => {
      requestRef.current = request;
      onSearchChange({ status: STATUS.LOADING, queryEcho: request.query });

      const result = await fetchShowsPage(request);
      if (result.status === 'aborted') return;

      onSearchChange({
        status: result.status === 'success' ? STATUS.SUCCESS : STATUS.ERROR,
      });
    },
    [onSearchChange],
  );

  // Retry re-issues the current q/genre/page request as it stands.
  const retry = useCallback(() => {
    const current = requestRef.current;
    if (current) void runRequest(current);
  }, [runRequest]);

  const isCurrentQuery = useCallback(
    (query: string) => requestRef.current?.query === query,
    [],
  );

  // Discarding a search aborts through the Task layer, never directly.
  const abortSearch = useCallback(() => abortShowsFetch(), []);

  return { runRequest, retry, isCurrentQuery, abortSearch, requestRef };
};
