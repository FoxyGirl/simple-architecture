import { useCallback, useRef } from 'react';

import { searchShowsPage } from '@api/shows';

import type { SearchChange, SearchRequest } from './types';

import { STATUS } from './constants';

const isAbortError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'name' in error &&
  error.name === 'AbortError';

/**
 * The `/api/search` request machinery owned by the page presenter. Every run
 * aborts the previous in-flight request and reports its status through the
 * snapshot; the last request is remembered so genre/page selections, retries
 * and the search-field deduplication can build on it.
 */
export const useShowsDataFetching = (
  onSearchChange: (change: SearchChange) => void,
) => {
  const controllerRef = useRef<AbortController | null>(null);
  const requestRef = useRef<SearchRequest | null>(null);

  const runRequest = useCallback(
    async (request: SearchRequest) => {
      controllerRef.current?.abort();
      requestRef.current = request;

      const controller = new AbortController();
      controllerRef.current = controller;

      onSearchChange({
        status: STATUS.LOADING,
        data: null,
        queryEcho: request.query,
      });

      try {
        const page = await searchShowsPage(
          request.query,
          { genre: request.genre, page: request.page },
          { signal: controller.signal },
        );

        onSearchChange({
          status: STATUS.SUCCESS,
          data: page,
          queryEcho: request.query,
        });
      } catch (requestError) {
        if (isAbortError(requestError)) return;

        onSearchChange({
          status: STATUS.ERROR,
          data: null,
          queryEcho: request.query,
        });
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
        }
      }
    },
    [onSearchChange],
  );

  const abortSearch = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  const isCurrentQuery = useCallback(
    (query: string) => requestRef.current?.query === query,
    [],
  );

  return { runRequest, abortSearch, isCurrentQuery, requestRef };
};
