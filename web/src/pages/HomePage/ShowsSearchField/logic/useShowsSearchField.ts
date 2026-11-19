import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

import type { SearchChange, SearchControls } from '../../types';

import { STATUS } from '../../constants';

const DEBOUNCE_MS = 800;

type UseShowsSearchFieldParams = {
  onSearchChange: (change: SearchChange) => void;
  registerControls: (controls: SearchControls | null) => void;
  submitSearch: (query: string) => void;
  isCurrentQuery: (query: string) => boolean;
  abortSearch: () => void;
};

export const useShowsSearchField = ({
  onSearchChange,
  registerControls,
  submitSearch,
  isCurrentQuery,
  abortSearch,
}: UseShowsSearchFieldParams) => {
  const [query, setQuery] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  // The request is driven by the debounced query: typing only schedules a
  // submission through the page presenter, and the in-flight one is dropped
  // as soon as the query changes.
  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      onSearchChange({ status: STATUS.IDLE, queryEcho: '' });
      return;
    }

    if (isCurrentQuery(trimmed)) {
      onSearchChange({ status: STATUS.SUCCESS, queryEcho: trimmed });
      return;
    }

    // The request is already inevitable, so report it right away: the view
    // shows skeletons while the debounce is still pending.
    onSearchChange({ status: STATUS.LOADING, queryEcho: trimmed });

    const timer = setTimeout(() => {
      submitSearch(trimmed);
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      abortSearch();
    };
  }, [query, onSearchChange, submitSearch, isCurrentQuery, abortSearch]);

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const clearSearch = useCallback(() => {
    abortSearch();
    setQuery('');
    inputRef.current?.focus();
  }, [abortSearch]);

  // Expose the input reset so the page can clear the field from the results.
  useEffect(() => {
    registerControls({ clearSearch });

    return () => registerControls(null);
  }, [registerControls, clearSearch]);

  return {
    query,
    handleSearch,
    clearQuery: clearSearch,
    inputRef,
  };
};
