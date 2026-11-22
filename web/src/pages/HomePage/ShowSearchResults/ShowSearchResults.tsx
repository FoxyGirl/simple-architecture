import { Eraser, RotateCcw, SearchX, TriangleAlert } from 'lucide-react';

import type { LoadingScope, Selection } from '../types';

import type { SearchStatus } from '../constants';

import { useShowSearchResults } from './logic/useShowSearchResults';
import { ResultsFrame } from './ResultsFrame';
import { Skeleton } from './Skeleton';
import { StatusPanel } from './StatusPanel';

import styles from './ShowSearchResults.module.css';

type ShowSearchResultsProps = {
  status: SearchStatus;
  loadingScope: LoadingScope | null;
  errorMessage: string | null;
  queryEcho: string;
  selection: Selection;
  onGenreSelect: (genre: string) => void;
  onPageSelect: (page: number) => void;
  onRetry: () => void;
  onClear: () => void;
};

export const ShowSearchResults = ({
  status,
  loadingScope,
  errorMessage,
  queryEcho,
  selection,
  onGenreSelect,
  onPageSelect,
  onRetry,
  onClear,
}: ShowSearchResultsProps) => {
  const {
    frameData,
    isLoading,
    isError,
    isSelectionLoad,
    isEmptyResponse,
    isIdle,
  } = useShowSearchResults({ status, loadingScope });

  if (isIdle) return null;

  return (
    <section
      className={styles.results}
      aria-live="polite"
      aria-busy={isLoading}
    >
      {isLoading && !isSelectionLoad && <Skeleton />}

      {isError && (
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

      {isEmptyResponse && (
        <StatusPanel
          overline="STATE · EMPTY"
          icon={SearchX}
          variant="empty"
          title="No shows found."
          body="Try another search. Check the spelling or explore a different title from the TVmaze catalogue."
          action={{ icon: Eraser, label: 'Clear search', onClick: onClear }}
        />
      )}

      {frameData && (
        <ResultsFrame
          data={frameData}
          selection={selection}
          queryEcho={queryEcho}
          isSelectionLoad={isSelectionLoad}
          onGenreSelect={onGenreSelect}
          onPageSelect={onPageSelect}
        />
      )}
    </section>
  );
};
