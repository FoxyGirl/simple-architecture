import { useCallback, useEffect, useRef, useState } from 'react';

import type { SearchChange, SearchControls } from '../types';

import { STATUS, type SearchStatus } from '../constants';
import { isSameRequest, toRequest, toSelection } from './urlState';
import { useShowFavorites } from './useShowFavorites';
import { useShowsRequest } from './useShowsRequest';
import { useStoredSearchPage } from './useStoredSearchPage';
import { useUrlSearchState } from './useUrlSearchState';

export const useHomePage = () => {
  const url = useUrlSearchState();
  const { search, genre, page, resetGenre } = url;

  const [status, setStatus] = useState<SearchStatus>(() =>
    search ? STATUS.LOADING : STATUS.IDLE,
  );

  const handleSearchChange = useCallback((change: SearchChange) => {
    if (change.status !== undefined) setStatus(change.status);
  }, []);

  const { runRequest, retry, abortSearch, requestRef } =
    useShowsRequest(handleSearchChange);

  // The URL state is the only request trigger: identical values are deduped
  // against the last request, superseded runs are aborted by the Task.
  useEffect(() => {
    if (!search) return;

    const request = toRequest(search, toSelection({ search, genre, page }));
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
