import type { SearchSession } from '@store';

import type { SearchRequest, SearchSnapshot, Selection } from '../types';

import { STATUS } from '../constants';
import { ALL_GENRES } from '../ShowSearchResults/constants';

export const INITIAL_SELECTION: Selection = { genre: ALL_GENRES, page: 1 };

/**
 * The genre/page selection mapped onto the request parameters the API
 * speaks: an undefined genre means "All genres".
 */
export const toRequest = (
  query: string,
  selection: Selection,
): SearchRequest => ({
  query,
  genre: selection.genre === ALL_GENRES ? undefined : selection.genre,
  page: selection.page,
});

const selectionOf = (session: SearchSession): Selection => ({
  genre: session.genre,
  page: session.page,
});

/**
 * The snapshot a restored session starts from: a successful search with
 * the persisted query and selection, so the stored Entity result renders
 * without the new-search genre/page reset. Without a session the page
 * starts exactly as a fresh app start does.
 */
export const restoredSnapshot = (
  session: SearchSession | null,
): SearchSnapshot =>
  session === null
    ? { status: STATUS.IDLE, queryEcho: '', selection: INITIAL_SELECTION }
    : {
        status: STATUS.SUCCESS,
        queryEcho: session.query,
        selection: selectionOf(session),
      };

/** The request a persisted session describes, for the mount re-fetch. */
export const sessionRequest = (session: SearchSession): SearchRequest =>
  toRequest(session.query, selectionOf(session));

/**
 * The session a successful request persists: the query it ran with plus
 * the genre/page selection the backend actually served (the response page
 * may be clamped, so it is the authoritative page).
 */
export const sessionOf = (
  request: SearchRequest,
  page: number,
): SearchSession => ({
  query: request.query,
  genre: request.genre ?? ALL_GENRES,
  page,
});
