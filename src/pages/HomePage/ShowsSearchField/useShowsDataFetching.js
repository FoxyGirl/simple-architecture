import { useCallback, useRef } from 'react';

import { searchShows } from '@api/tvmaze.js';
import { STATUS } from '../constants.js';

export const useShowsDataFetching = (onSearchChange) => {
  const controllerRef = useRef(null);
  const lastQueryRef = useRef('');

  const runSearch = useCallback(
    async (nextQuery) => {
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
        if (requestError.name === 'AbortError') return;

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
