import { useCallback, useEffect, useRef, useState } from 'react';

import { searchShows } from '../../../api/tvmaze.js';

const DEBOUNCE_MS = 300;

const IDLE = 'idle';
const LOADING = 'loading';
const SUCCESS = 'success';
const ERROR = 'error';

export const usePresenterSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState(IDLE);
  const [searchedQuery, setSearchedQuery] = useState('');

  const controllerRef = useRef(null);

  const runSearch = useCallback(async (nextQuery) => {
    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    setStatus(LOADING);
    setSearchedQuery(nextQuery);

    try {
      const shows = await searchShows(nextQuery, { signal: controller.signal });
      setResults(shows);
      setStatus(SUCCESS);
    } catch (requestError) {
      if (requestError.name === 'AbortError') return;
      setStatus(ERROR);
    }
  }, []);

  // The request is driven by the debounced query: typing only schedules a
  // call, and the in-flight one is dropped as soon as the query changes.
  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) return undefined;

    const timer = setTimeout(() => {
      runSearch(trimmed);
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controllerRef.current?.abort();
    };
  }, [query, runSearch]);

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

  // An empty query means "no search", and results fetched for another query
  // are stale, so both states are derived instead of being reset by hand.
  const trimmedQuery = query.trim();
  const isIdle = trimmedQuery.length === 0;
  const isStale = !isIdle && searchedQuery !== trimmedQuery;

  const currentStatus = isIdle ? IDLE : isStale ? LOADING : status;

  return {
    query,
    results: isIdle ? [] : results,
    status: currentStatus,
    isLoading: currentStatus === LOADING,
    handleSearch,
    clearQuery,
    clearSearch,
    retry,
  };
};
