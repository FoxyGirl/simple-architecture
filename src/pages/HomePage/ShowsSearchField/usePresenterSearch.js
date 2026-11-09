import { useCallback, useEffect, useRef, useState } from 'react';

import { searchShows } from '../../../api/tvmaze.js';

const DEBOUNCE_MS = 300;

const IDLE = 'idle';
const LOADING = 'loading';
const SUCCESS = 'success';
const ERROR = 'error';

export const usePresenterSearch = ({ onSearchChange, registerControls }) => {
  const [query, setQuery] = useState('');

  const controllerRef = useRef(null);

  const runSearch = useCallback(
    async (nextQuery) => {
      controllerRef.current?.abort();

      const controller = new AbortController();
      controllerRef.current = controller;

      onSearchChange({ status: LOADING, data: [], queryEcho: nextQuery });

      try {
        const shows = await searchShows(nextQuery, {
          signal: controller.signal,
        });
        onSearchChange({ status: SUCCESS, data: shows, queryEcho: nextQuery });
      } catch (requestError) {
        if (requestError.name === 'AbortError') return;
        onSearchChange({ status: ERROR, data: [], queryEcho: nextQuery });
      }
    },
    [onSearchChange],
  );

  // The request is driven by the debounced query: typing only schedules a
  // call, and the in-flight one is dropped as soon as the query changes.
  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      onSearchChange({ status: IDLE, data: [], queryEcho: '' });
      return undefined;
    }

    // The request is already inevitable, so report it right away: the view
    // shows skeletons while the debounce is still pending.
    onSearchChange({ status: LOADING, data: [], queryEcho: trimmed });

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

  const clearQuery = useCallback(() => {
    setQuery('');
  }, []);

  const clearSearch = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;

    setQuery('');
  }, []);

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
  };
};
