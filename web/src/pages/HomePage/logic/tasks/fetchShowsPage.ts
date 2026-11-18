import { searchShowsPage } from '@api/shows';
import { searchResultStored, store } from '@store';

import type { SearchRequest, ShowsFetchResult } from '../../types';

const isAbortError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'name' in error &&
  error.name === 'AbortError';

/**
 * The newest run's controller — task-owned in-flight coordination, kept
 * out of Redux because it is not application data. A new run aborts the
 * previous request, exactly as the old page-level fetch machinery did.
 */
let inFlight: AbortController | null = null;

/**
 * The shows-fetch Task: fetches one search-result page through the API
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
    const page = await searchShowsPage(
      request.query,
      { genre: request.genre, page: request.page },
      { signal: controller.signal },
    );

    // A response that arrives after its request was superseded must not
    // overwrite the newer data the next run already stored.
    if (controller.signal.aborted) return { status: 'aborted' };

    store.dispatch(searchResultStored(page));

    return { status: 'success', page };
  } catch (error) {
    if (isAbortError(error)) return { status: 'aborted' };

    return { status: 'error' };
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
