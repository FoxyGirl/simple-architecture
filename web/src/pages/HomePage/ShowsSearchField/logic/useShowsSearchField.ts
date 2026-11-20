import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

import type { SearchChange, SearchControls } from '../../types';

import { STATUS } from '../../constants';

const DEBOUNCE_MS = 800;

type UseShowsSearchFieldParams = {
  search: string;
  onSearchChange: (change: SearchChange) => void;
  registerControls: (controls: SearchControls | null) => void;
  applySearch: (query: string) => void;
  abortSearch: () => void;
};

export const useShowsSearchField = ({
  search,
  onSearchChange,
  registerControls,
  applySearch,
  abortSearch,
}: UseShowsSearchFieldParams) => {
  // The draft is what the user typed; `applied` records the URL value it was
  // typed against, so a URL change from navigation wins over a stale draft.
  const [draft, setDraft] = useState({ applied: search, value: search });
  const query = draft.applied === search ? draft.value : search;

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // An external change (back/forward, programmatic clear) discards the
    // draft; an empty URL search is the idle state.
    if (draft.applied !== search) {
      if (!search) onSearchChange({ status: STATUS.IDLE, queryEcho: '' });
      return;
    }

    const trimmed = draft.value.trim();
    if (trimmed === search) return;

    // The request is already inevitable, so report it right away: the view
    // shows skeletons while the debounce is still pending.
    onSearchChange({
      status: trimmed ? STATUS.LOADING : STATUS.IDLE,
      queryEcho: trimmed,
    });

    const timer = setTimeout(() => applySearch(trimmed), DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      abortSearch();
    };
  }, [draft, search, onSearchChange, applySearch, abortSearch]);

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    setDraft({ applied: search, value: event.target.value });
  };

  const clearSearch = useCallback(() => {
    abortSearch();
    setDraft({ applied: search, value: '' });
    inputRef.current?.focus();
  }, [abortSearch, search]);

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
