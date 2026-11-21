import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

const DEBOUNCE_MS = 800;

type UseShowsSearchFieldParams = {
  search: string;
  onDraftChange: (draft: string | null) => void;
  applySearch: (query: string) => void;
  abortSearch: () => void;
};

export const useShowsSearchField = ({
  search,
  onDraftChange,
  applySearch,
  abortSearch,
}: UseShowsSearchFieldParams) => {
  // The draft is what the user typed; `applied` records the URL value it was
  // typed against, so a URL change from navigation wins over a stale draft.
  const [draft, setDraft] = useState({ applied: search, value: search });
  const query = draft.applied === search ? draft.value : search;

  const inputRef = useRef<HTMLInputElement>(null);

  // The page derives its presentation status from the pending draft, so the
  // field only reports whether the input still matches the applied search:
  // `null` means no pending draft, any other value is the trimmed text whose
  // debounced URL write is inevitable.
  useEffect(() => {
    // An external change (back/forward, programmatic clear) discards the
    // draft; the applied URL search wins.
    if (draft.applied !== search) {
      onDraftChange(null);
      return;
    }

    const trimmed = draft.value.trim();

    // The draft is back to the applied search, so the debounced write is not
    // going to run and the page shows the results the URL already describes
    // — its filters and pagination included.
    if (trimmed === search) {
      onDraftChange(null);
      return;
    }

    // The request is already inevitable, so report the draft right away:
    // the view shows skeletons while the debounce is still pending.
    onDraftChange(trimmed);

    const timer = setTimeout(() => applySearch(trimmed), DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [draft, search, onDraftChange, applySearch]);

  // An externally emptied search (the results' empty-state action, a back
  // navigation to the idle URL) returns focus to the input, matching the
  // field's own clear button.
  useEffect(() => {
    if (!search) inputRef.current?.focus();
  }, [search]);

  // Leaving the page discards the fetch the draft left in flight; a draft
  // change must not — the applied search's run is still the truth the
  // restoration returns to, and a committed draft aborts it by superseding
  // it through the Task.
  useEffect(() => () => abortSearch(), [abortSearch]);

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    setDraft({ applied: search, value: event.target.value });
  };

  const clearQuery = () => {
    abortSearch();
    setDraft({ applied: search, value: '' });
    inputRef.current?.focus();
  };

  return {
    query,
    handleSearch,
    clearQuery,
    inputRef,
  };
};
