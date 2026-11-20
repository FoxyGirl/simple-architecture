import { useCallback, useEffect, useRef, useState } from 'react';

import type { SearchChange, SearchControls, UrlSearchState } from '../types';

import { STATUS } from '../constants';
import { toRequest } from './searchSession';
import { isSameRequest, toSelection } from './urlState';
import { useRestoredRequest } from './useRestoredRequest';
import { useRestoredSession } from './useRestoredSession';
import { useShowFavorites } from './useShowFavorites';
import { useShowsRequest } from './useShowsRequest';
import { useStoredSearchPage } from './useStoredSearchPage';
import { useUrlSearchState } from './useUrlSearchState';

export const useHomePage = () => {
  const restored = useRestoredSession();
  // The transitional fallback is frozen at mount: a parameter-less `/` with
  // a persisted session seeds the page until the first URL write.
  const [seed] = useState<UrlSearchState | null>(() =>
    restored.initialRequest === null
      ? null
      : {
          search: restored.initialQuery,
          genre: restored.initialSnapshot.selection.genre,
          page: restored.initialSnapshot.selection.page,
        },
  );
  const url = useUrlSearchState(seed);
  const { search, genre, page, fallbackActive, resetGenre } = url;

  const [status, setStatus] = useState(() =>
    fallbackActive
      ? restored.initialSnapshot.status
      : search
        ? STATUS.LOADING
        : STATUS.IDLE,
  );

  const handleSearchChange = useCallback((change: SearchChange) => {
    if (change.status !== undefined) setStatus(change.status);
  }, []);

  const restoredRequest = fallbackActive ? restored.initialRequest : null;
  const { runRequest, retry, abortSearch, requestRef } = useShowsRequest(
    handleSearchChange,
    restoredRequest,
  );

  // The URL state is the only request trigger: identical values are deduped
  // against the last request, superseded runs are aborted by the Task.
  useEffect(() => {
    if (fallbackActive || !search) return;

    const request = toRequest(search, toSelection({ search, genre, page }));
    if (isSameRequest(requestRef.current, request)) return;

    void runRequest(request).then((result) => {
      if (result.status !== 'success' || !request.genre) return;
      if (requestRef.current !== request) return;
      if (result.page.genres.includes(request.genre)) return;

      resetGenre();
    });
  }, [fallbackActive, search, genre, page, resetGenre, runRequest, requestRef]);

  // The shows themselves are Entity data read through its selectors — only
  // a successful status echoes them to the View, so a loading or failed
  // request never renders a stale page.
  const storedResult = useStoredSearchPage();
  const data = status === STATUS.SUCCESS ? storedResult : null;

  // A restored session whose stored result is gone re-fetches once on mount.
  useRestoredRequest(restoredRequest, storedResult.page, runRequest);

  const controlsRef = useRef<SearchControls | null>(null);

  const registerControls = useCallback((controls: SearchControls | null) => {
    controlsRef.current = controls;
  }, []);

  // The favorites Entity data the cards' heart buttons reflect; the toggle
  // itself is the shared Task's business rule, its success the toast the
  // global notify API renders.
  const { isFavorite, toggleFavorite, count, goToFavorites } =
    useShowFavorites();

  const clearSearch = () => {
    controlsRef.current?.clearSearch();
  };

  return {
    data,
    queryEcho: search,
    status,
    selection: { genre, page },
    search,
    isFavorite,
    count,
    onSearchChange: handleSearchChange,
    registerControls,
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
