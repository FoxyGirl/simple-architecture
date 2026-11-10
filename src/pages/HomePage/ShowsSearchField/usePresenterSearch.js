import { useCallback, useEffect, useRef, useState } from 'react';

import { searchShows } from '@api/tvmaze.js';
import { STATUS } from '../constants.js';

const DEBOUNCE_MS = 300;

export const usePresenterSearch = ({ onSearchChange, registerControls }) => {
  const [query, setQuery] = useState('');

  const controllerRef = useRef(null);
  const inputRef = useRef(null);

  const runSearch = useCallback(
    async (nextQuery) => {
      controllerRef.current?.abort();

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
      }
    },
    [onSearchChange],
  );

  // The request is driven by the debounced query: typing only schedules a
  // call, and the in-flight one is dropped as soon as the query changes.
  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      onSearchChange({ status: STATUS.IDLE, data: [], queryEcho: '' });
      return undefined;
    }

    // The request is already inevitable, so report it right away: the view
    // shows skeletons while the debounce is still pending.
    onSearchChange({ status: STATUS.LOADING, data: [], queryEcho: trimmed });

    const timer = setTimeout(() => {
      runSearch(trimmed);
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controllerRef.current?.abort();
    };
  }, [query, runSearch, onSearchChange]);

  const handleSearch = useCallback((event) => {
    setQuery(event.target.value);
  }, []);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const clearQuery = useCallback(() => {
    setQuery('');
    focusInput();
  }, [focusInput]);

  const clearSearch = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;

    setQuery('');
    focusInput();
  }, [focusInput]);

  const retry = useCallback(() => {
    const trimmed = query.trim();
    if (!trimmed) return;

    runSearch(trimmed);
  }, [query, runSearch]);

  // Expose the search commands so the results view can trigger them.
  useEffect(() => {
    registerControls({ retry, clearSearch });

    return () => registerControls(null);
  }, [registerControls, retry, clearSearch]);

  return {
    query,
    handleSearch,
    clearQuery,
    inputRef,
  };
};
