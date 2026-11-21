import { useEffect, useState } from 'react';

import { STATUS, type SearchStatus } from '../constants';
import { isSameRequest, toRequest } from './urlState';
import { useShowFavorites } from './useShowFavorites';
import { useShowsRequest } from './useShowsRequest';
import { useStoredSearchPage } from './useStoredSearchPage';
import { useUrlSearchState } from './useUrlSearchState';

export const useHomePage = () => {
  const url = useUrlSearchState();
  const { search, genre, page, resetGenre } = url;

  // The request status is written by the Task coordination alone; a mount
  // whose URL already carries a search starts out loading its restoration.
  const {
    runRequest,
    retry,
    abortSearch,
    requestRef,
    status: requestStatus,
    errorMessage,
  } = useShowsRequest(search ? STATUS.LOADING : STATUS.IDLE);

  // The uncommitted draft of the search field, `null` while the field shows
  // the applied URL search. A pending draft owns the screen: a non-empty
  // draft is inevitably going to be requested (loading), an empty one is
  // the idle state. Otherwise the applied search decides — no search is
  // idle, a search shows the outcome of its request, so a restoration
  // racing an in-flight fetch keeps showing that fetch's loading state.
  const [draft, setDraft] = useState<string | null>(null);

  let status: SearchStatus = search ? requestStatus : STATUS.IDLE;
  if (draft !== null) {
    status = draft ? STATUS.LOADING : STATUS.IDLE;
  }

  // The URL state is the only request trigger: identical values are deduped
  // against the last request, superseded runs are aborted by the Task.
  useEffect(() => {
    if (!search) return;

    const request = toRequest(search, { genre, page });
    if (isSameRequest(requestRef.current, request)) return;

    void runRequest(request).then((result) => {
      if (result.status !== 'success' || !request.genre) return;
      if (requestRef.current !== request) return;
      if (result.page.genres.includes(request.genre)) return;

      resetGenre();
    });
  }, [search, genre, page, resetGenre, runRequest, requestRef]);

  // The shows themselves are Entity data read through its selectors — only
  // a successful status echoes them to the View, so a loading or failed
  // request never renders a stale page.
  const storedResult = useStoredSearchPage();
  const data = status === STATUS.SUCCESS ? storedResult : null;

  // The favorites Entity data the cards' heart buttons reflect; the toggle
  // itself is the shared Task's business rule, its success the toast the
  // global notify API renders.
  const { isFavorite, toggleFavorite, count, goToFavorites } =
    useShowFavorites();

  // The results' empty-state action: clearing writes the idle URL, and the
  // search field re-syncs its draft (and focus) from it — no imperative
  // channel into the field is needed.
  const clearSearch = () => {
    abortSearch();
    url.applySearch('');
  };

  return {
    data,
    status,
    errorMessage,
    selection: { genre, page },
    search,
    isFavorite,
    count,
    onDraftChange: setDraft,
    applySearch: url.applySearch,
    selectGenre: url.selectGenre,
    selectPage: url.selectPage,
    toggleFavorite,
    goToFavorites,
    abortSearch,
    retry,
    clearSearch,
  };
};
