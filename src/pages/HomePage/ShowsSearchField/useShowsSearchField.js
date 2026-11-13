import { useCallback, useEffect, useRef, useState } from 'react';

import { STATUS } from '../constants.js';
import { useShowsDataFetching } from './useShowsDataFetching.js';

const DEBOUNCE_MS = 800;

export const useShowsSearchField = ({ onSearchChange, registerControls }) => {
  const [query, setQuery] = useState('');

  const inputRef = useRef(null);

  const { runSearch, abortSearch, lastQueryRef } =
    useShowsDataFetching(onSearchChange);

  // The request is driven by the debounced query: typing only schedules a
  // call, and the in-flight one is dropped as soon as the query changes.
  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      onSearchChange({ status: STATUS.IDLE, queryEcho: '' });
      return;
    }

    if (trimmed === lastQueryRef.current) {
      onSearchChange({ status: STATUS.SUCCESS, queryEcho: trimmed });
      return;
    }

    // The request is already inevitable, so report it right away: the view
    // shows skeletons while the debounce is still pending.
    onSearchChange({ status: STATUS.LOADING, queryEcho: trimmed });

    const timer = setTimeout(() => {
      runSearch(trimmed);
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      abortSearch();
    };
  }, [query, runSearch, abortSearch, onSearchChange, lastQueryRef]);

  const handleSearch = (event) => {
    setQuery(event.target.value);
  };

  const clearSearch = useCallback(() => {
    abortSearch();
    setQuery('');
    inputRef.current?.focus();
  }, [abortSearch]);

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
    clearQuery: clearSearch,
    inputRef,
  };
};
