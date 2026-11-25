import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useSearchParams } from 'react-router-dom';

import {
  selectFavoritesHasLoaded,
  selectFavoritesTotalCount,
} from '~/store/favorites/selectors';

import { parsePageParam } from '../../utils';
import { RESULTS_PER_PAGE } from '../constants';

// Builds the search params for the given page: page 1 omits the parameter,
// every other page writes it.
const buildPageParams = (
  searchParams: URLSearchParams,
  nextPage: number,
): URLSearchParams => {
  const params = new URLSearchParams(searchParams);

  if (nextPage > 1) {
    params.set('page', String(nextPage));
  } else {
    params.delete('page');
  }

  return params;
};

/**
 * The Favorites URL page state: reads the `page` parameter, pushes it on
 * selection, replaces an out-of-range value with the last known page and
 * derives `pageCount` from the Entity. Writes carry the current navigation
 * state, so "Back to Home" survives.
 */
export const useUrlFavoriteState = () => {
  const totalCount = useSelector(selectFavoritesTotalCount);
  const hasLoaded = useSelector(selectFavoritesHasLoaded);

  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const pageCount = Math.max(1, Math.ceil(totalCount / RESULTS_PER_PAGE));

  const page = parsePageParam(searchParams.get('page'));

  // The correction waits for the first fetched page: before it lands the
  // total is unknown, and a deep link to a valid page must survive.
  useEffect(() => {
    if (!hasLoaded || page <= pageCount) return;

    setSearchParams(buildPageParams(searchParams, pageCount), {
      replace: true,
      state: location.state,
    });
  }, [
    hasLoaded,
    page,
    pageCount,
    searchParams,
    setSearchParams,
    location.state,
  ]);

  const selectPage = (nextPage: number) => {
    setSearchParams(buildPageParams(searchParams, nextPage), {
      state: location.state,
    });
  };

  return { page, selectPage, pageCount };
};
