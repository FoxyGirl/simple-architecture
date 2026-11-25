import { STATUS, type SearchStatus } from '../../constants';
import type { LoadingScope } from '../../types';

import { useStoredSearchPage } from './useStoredSearchPage';

type ShowSearchResultsDataParams = {
  status: SearchStatus;
  loadingScope: LoadingScope | null;
};

/**
 * The ShowSearchResults presenter: the shows themselves are Entity data read
 * through its selectors — the Entity keeps the last successful page while a
 * new selection loads, so a cards-scoped load can keep the results frame and
 * skeletonize the cards. Anything else only echoes the data of a successful
 * status, so a new query or a failed request never renders a stale page. The
 * status and scope stay inputs from the page presenter: they are its
 * request-scoped state, which the Entity must not carry. Every derived value
 * the View renders by is prepared here; `frameData` is the stored page
 * narrowed to the runs that render the results frame, `null` otherwise.
 */
export const useShowSearchResults = ({
  status,
  loadingScope,
}: ShowSearchResultsDataParams) => {
  const storedResult = useStoredSearchPage();

  const data =
    status === STATUS.SUCCESS || loadingScope === 'cards' ? storedResult : null;

  const isDataEmpty = data === null || data.shows.length === 0;
  const isIdle = status === STATUS.IDLE;
  const isLoading = status === STATUS.LOADING;
  const isError = status === STATUS.ERROR;
  const isSuccess = status === STATUS.SUCCESS && data !== null;

  // A selection load keeps the frame of the stored page on screen and only
  // the cards are skeletonized; anything else invalidates the whole block.
  const isSelectionLoad =
    isLoading && loadingScope === 'cards' && data !== null;

  // The frame renders the stored page on success with results, or while a
  // selection load swaps the cards of that stored page.
  const hasFrame =
    data !== null && (isSelectionLoad || (isSuccess && !isDataEmpty));

  const isEmptyResponse = !isLoading && isSuccess && isDataEmpty;

  return {
    frameData: hasFrame ? data : null,
    isLoading,
    isError,
    isSelectionLoad,
    isEmptyResponse,
    isIdle,
  };
};
