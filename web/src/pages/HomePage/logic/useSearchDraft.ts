import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

const DEBOUNCE_MS = 800;

type DraftState = {
  applied: string;
  value: string;
};

type SearchDraftParams = {
  search: string;
  applySearch: (query: string) => void;
  abortSearch: () => void;
};

/**
 * The search-field aspect of the page presenter: the draft is what the user
 * typed, `applied` records the URL value it was typed against, so an external
 * URL change (back/forward, a programmatic clear) wins over a stale draft.
 * The pending draft is derived, not reported: `null` while the input matches
 * the applied search, otherwise the trimmed text whose debounced URL write is
 * inevitable — the page derives its presentation status from it in the same
 * render. The hook also owns the field's focus (an externally emptied search
 * returns focus to the input) and discards the in-flight fetch when the page
 * unmounts; a draft change must not abort — the applied search's run is still
 * the truth a restoration returns to, and a committed draft supersedes it
 * through the Task.
 */
export const useSearchDraft = ({
  search,
  applySearch,
  abortSearch,
}: SearchDraftParams) => {
  const [draft, setDraft] = useState<DraftState>({
    applied: search,
    value: search,
  });

  const inputRef = useRef<HTMLInputElement>(null);

  // An external change wins: the input re-syncs from the applied search and
  // no draft is pending against it.
  const query = draft.applied === search ? draft.value : search;

  // The page derives its status from the pending draft: a non-empty draft is
  // inevitably going to be requested (loading), an empty one is the idle
  // state, and no draft leaves the decision to the applied search.
  let pendingDraft: string | null = null;
  if (draft.applied === search) {
    const trimmed = draft.value.trim();
    if (trimmed !== search) pendingDraft = trimmed;
  }

  // The request is inevitable once a draft differs from the applied search,
  // so only the debounced write needs scheduling here.
  useEffect(() => {
    if (draft.applied !== search) return;

    const trimmed = draft.value.trim();
    if (trimmed === search) return;

    const timer = setTimeout(() => applySearch(trimmed), DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [draft, search, applySearch]);

  // An externally emptied search (the results' empty-state action, a back
  // navigation to the idle URL) returns focus to the input, matching the
  // field's own clear button.
  useEffect(() => {
    if (!search) inputRef.current?.focus();
  }, [search]);

  useEffect(() => () => abortSearch(), [abortSearch]);

  const onQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDraft({ applied: search, value: event.target.value });
  };

  const clearQuery = () => {
    abortSearch();
    setDraft({ applied: search, value: '' });
    inputRef.current?.focus();
  };

  return {
    query,
    draft: pendingDraft,
    inputRef,
    onQueryChange,
    clearQuery,
  };
};
