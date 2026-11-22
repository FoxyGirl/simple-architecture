import { useEffect } from 'react';

import { STATUS, type SearchStatus } from '../constants';
import type { LoadingScope } from '../types';

import { toRequest } from './urlState';
import { useSearchDraft } from './useSearchDraft';
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
    lastSuccessQuery,
    status: requestStatus,
    errorMessage,
  } = useShowsRequest(search ? STATUS.LOADING : STATUS.IDLE);

  // The search field is a controlled presentational component: the draft,
  // its debounce, the focus handling and the unmount abort all live here, at
  // Presenter level. The pending draft is `null` while the field shows the
  // applied URL search; otherwise it owns the screen — a non-empty draft is
  // inevitably going to be requested (loading), an empty one is the idle
  // state. With no draft the applied search decides: no search is idle, a
  // search shows the outcome of its request, so a restoration racing an
  // in-flight fetch keeps showing that fetch's loading state.
  const { query, draft, inputRef, onQueryChange, clearQuery } = useSearchDraft({
    search,
    applySearch: url.applySearch,
    abortSearch,
  });

  let status: SearchStatus = search ? requestStatus : STATUS.IDLE;
  if (draft !== null) {
    status = draft ? STATUS.LOADING : STATUS.IDLE;
  }

  // Which part of the screen the loading replaces: the same query as the
  // stored page means only the selection (genre/page) changed, so the head,
  // filters and pagination stay and only the cards are swapped. A different
  // query invalidates the whole results block.
  let loadingScope: LoadingScope | null = null;
  if (status === STATUS.LOADING) {
    // The URL search is the query of every request the page issues; a
    // pending draft is the query the next one is about to carry.
    const pendingQuery = draft ?? search;

    loadingScope = pendingQuery === lastSuccessQuery ? 'cards' : 'full';
  }

  // The URL state is the only request trigger: dedupe, abort and the
  // unavailable-genre reset all live in the request hook and the Task.
  useEffect(() => {
    if (!search) return;

    void runRequest(toRequest(search, { genre, page }), {
      onGenreUnavailable: resetGenre,
    });
  }, [search, genre, page, resetGenre, runRequest]);

  // The shows themselves are Entity data read through its selectors — the
  // Entity keeps the last successful page while a new selection loads, so a
  // cards-scoped load can keep the results frame and skeletonize the cards.
  // Anything else only echoes the data of a successful status, so a new
  // query or a failed request never renders a stale page.
  const storedResult = useStoredSearchPage();
  const data =
    status === STATUS.SUCCESS || loadingScope === 'cards' ? storedResult : null;

  // The favorites summary the count button reflects; the mount syncs it
  // through the read Task. The cards' hearts and their toggle live in the
  // ShowList presenter, which reads the same Entity.
  const { count, goToFavorites } = useShowFavorites();

  // The results' empty-state action: clearing writes the idle URL, and the
  // draft hook re-syncs the field (and its focus) from that URL.
  const clearSearch = () => {
    abortSearch();
    url.applySearch('');
  };

  return {
    data,
    status,
    loadingScope,
    errorMessage,
    selection: { genre, page },
    search,
    query,
    inputRef,
    count,
    onQueryChange,
    clearQuery,
    selectGenre: url.selectGenre,
    selectPage: url.selectPage,
    goToFavorites,
    retry,
    clearSearch,
  };
};
