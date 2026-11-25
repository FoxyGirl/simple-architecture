import { toErrorMessage } from '~/api/errors';
import { buildApiUrl, requestJson } from '~/api/request';
import { replaceSearchResult, store } from '~/store';
import type { QueryParam, SearchPage } from '~/types';

import type { SearchRequest, ShowsFetchResult } from '../../types';

const isAbortError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'name' in error &&
  error.name === 'AbortError';

/**
 * The search HTTP operation of this Task: the backend owns the TVmaze
 * interaction, the genre filtering and the pagination, so the request only
 * carries the query and the selection. Omitting `genre` means "All genres".
 */
const requestSearchPage = (
  { query, genre, page }: SearchRequest,
  signal: AbortSignal,
): Promise<SearchPage> => {
  const params: QueryParam[] = [['q', query]];

  if (genre) params.push(['genre', genre]);
  if (page) params.push(['page', page]);

  return requestJson<SearchPage>(buildApiUrl('/api/search', params), signal);
};

/**
 * The newest run's controller — task-owned in-flight coordination, kept
 * out of Redux because it is not application data. A new run aborts the
 * previous request, exactly as the old page-level fetch machinery did.
 */
let inFlight: AbortController | null = null;

/**
 * The shows-fetch Task: fetches one search-result page through the request
 * layer and stores it in the Entity on success. All request data arrives
 * through the explicit `request` argument; the outcome is returned to the
 * caller and never read back from the store.
 */
export const fetchShowsPage = async (
  request: SearchRequest,
): Promise<ShowsFetchResult> => {
  inFlight?.abort();

  const controller = new AbortController();
  inFlight = controller;

  try {
    const page = await requestSearchPage(request, controller.signal);

    // A response that arrives after its request was superseded must not
    // overwrite the newer data the next run already stored.
    if (controller.signal.aborted) return { status: 'aborted' };

    store.dispatch(replaceSearchResult(page));

    return { status: 'success', page };
  } catch (error) {
    if (isAbortError(error)) return { status: 'aborted' };

    return { status: 'error', message: toErrorMessage(error) };
  } finally {
    if (inFlight === controller) inFlight = null;
  }
};

/**
 * Aborts the current in-flight shows fetch (the search field's discard /
 * cleanup path); the store keeps whatever the last successful run stored.
 */
export const abortShowsFetch = (): void => {
  inFlight?.abort();
  inFlight = null;
};
