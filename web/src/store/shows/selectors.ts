import type { RootState } from '../types';
import type { ShowsState } from './types';

/** The shows list of the current search result. */
export const selectShows = (state: RootState): ShowsState['shows'] =>
  state.shows.shows;

/** The 1-based page number of the current search result. */
export const selectPage = (state: RootState): number => state.shows.page;

/** How many pages the current query has. */
export const selectPageCount = (state: RootState): number =>
  state.shows.pageCount;

/** How many shows the current query matched in total. */
export const selectTotalCount = (state: RootState): number =>
  state.shows.totalCount;

/** The genres present in the current unfiltered result set. */
export const selectGenres = (state: RootState): ShowsState['genres'] =>
  state.shows.genres;
