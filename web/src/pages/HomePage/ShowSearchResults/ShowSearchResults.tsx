import { Eraser, RotateCcw, SearchX, TriangleAlert } from 'lucide-react';

import type { SearchPage, Show } from '~/types';

import type { LoadingScope, Selection } from '../types';

import { STATUS, type SearchStatus } from '../constants';

import { ResultsFrame } from './ResultsFrame';
import { Skeleton } from './Skeleton';
import { StatusPanel } from './StatusPanel';

import styles from './ShowSearchResults.module.css';

type ShowSearchResultsProps = {
  data: SearchPage | null;
  status: SearchStatus;
  loadingScope: LoadingScope | null;
  errorMessage: string | null;
  queryEcho: string;
  selection: Selection;
  isFavorite: (showId: number) => boolean;
  onGenreSelect: (genre: string) => void;
  onPageSelect: (page: number) => void;
  onToggleFavorite: (show: Show) => void;
  onRetry: () => void;
  onClear: () => void;
};

export const ShowSearchResults = ({
  data,
  status,
  loadingScope,
  errorMessage,
  queryEcho,
  selection,
  isFavorite,
  onGenreSelect,
  onPageSelect,
  onToggleFavorite,
  onRetry,
  onClear,
}: ShowSearchResultsProps) => {
  const isLoading = status === STATUS.LOADING;
  const isSuccess = status === STATUS.SUCCESS && data !== null;

  // A selection load keeps the frame of the stored page on screen and only
  // the cards are skeletonized; anything else invalidates the whole block.
  const isSelectionLoad =
    isLoading && loadingScope === 'cards' && data !== null;

  // The frame renders the stored page on success with results, or while a
  // selection load swaps the cards of that stored page.
  const hasFrame =
    data !== null && (isSelectionLoad || (isSuccess && data.shows.length > 0));

  if (status === STATUS.IDLE) return null;

  return (
    <section
      className={styles.results}
      aria-live="polite"
      aria-busy={isLoading}
    >
      {isLoading && !isSelectionLoad && <Skeleton />}

      {status === STATUS.ERROR && (
        <StatusPanel
          overline="STATE · ERROR"
          icon={TriangleAlert}
          variant="error"
          title="Something went wrong."
          body={
            errorMessage ??
            'We couldn’t reach the TVmaze API. Check your connection and give it another go.'
          }
          action={{
            icon: RotateCcw,
            label: 'Retry request',
            onClick: onRetry,
          }}
          actionAccent
        />
      )}

      {!isLoading && isSuccess && data.shows.length === 0 && (
        <StatusPanel
          overline="STATE · EMPTY"
          icon={SearchX}
          variant="empty"
          title="No shows found."
          body="Try another search. Check the spelling or explore a different title from the TVmaze catalogue."
          action={{ icon: Eraser, label: 'Clear search', onClick: onClear }}
        />
      )}

      {hasFrame && data !== null && (
        <ResultsFrame
          data={data}
          selection={selection}
          queryEcho={queryEcho}
          isSelectionLoad={isSelectionLoad}
          isFavorite={isFavorite}
          onGenreSelect={onGenreSelect}
          onPageSelect={onPageSelect}
          onToggleFavorite={onToggleFavorite}
        />
      )}
    </section>
  );
};
