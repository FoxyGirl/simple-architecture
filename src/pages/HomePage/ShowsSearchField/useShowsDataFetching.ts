import { useCallback, useRef } from 'react';

import { searchShows } from '@api/tvmaze';

import type { SearchChange } from '../types';

import { STATUS } from '../constants';

const isAbortError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'name' in error &&
  error.name === 'AbortError';

export const useShowsDataFetching = (
  onSearchChange: (change: SearchChange) => void,
) => {
  const controllerRef = useRef<AbortController | null>(null);
  const lastQueryRef = useRef('');

  const runSearch = useCallback(
    async (nextQuery: string) => {
      controllerRef.current?.abort();
      lastQueryRef.current = nextQuery;

      const controller = new AbortController();
      controllerRef.current = controller;

      onSearchChange({
        status: STATUS.LOADING,
        data: [],
        queryEcho: nextQuery,
      });

      try {
        const shows = await searchShows(nextQuery, {
          signal: controller.signal,
        });

        onSearchChange({
          status: STATUS.SUCCESS,
          data: shows,
          queryEcho: nextQuery,
        });
      } catch (requestError) {
        if (isAbortError(requestError)) return;

        onSearchChange({
          status: STATUS.ERROR,
          data: [],
          queryEcho: nextQuery,
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

  return {
    runSearch,
    abortSearch,
    lastQueryRef,
  };
};
