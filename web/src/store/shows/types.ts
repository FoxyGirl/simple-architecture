import type { SearchPage } from '~/api/types';

/**
 * The shows Entity state: the current search result — the page of shows the
 * UI renders plus the response metadata it derives pagination and the genre
 * filter from. Request status and every other UI-related concern stay in the
 * Presenter, per `docs/architecture.md`.
 */
export type ShowsState = SearchPage;
