import { Eraser, RotateCcw, SearchX, TriangleAlert } from 'lucide-react';

import type { SearchPage, Show } from '@api/types';
import { useMediaQuery } from '@hooks/useMediaQuery';

import type { Selection } from '../types';

import { STATUS, type SearchStatus } from '../constants';

import { Pagination } from '../../components/Pagination';

import { GenreFilter } from './GenreFilter';
import { ResultsHead } from './ResultsHead';
import { ShowList } from './ShowList';
import { Skeleton } from './Skeleton';
import { StatusPanel } from './StatusPanel';

import styles from './ShowSearchResults.module.css';

type ShowSearchResultsProps = {
  data: SearchPage | null;
  status: SearchStatus;
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
  queryEcho,
  selection,
  isFavorite,
  onGenreSelect,
  onPageSelect,
  onToggleFavorite,
  onRetry,
  onClear,
}: ShowSearchResultsProps) => {
  const { isDesktop } = useMediaQuery();

  const isLoading = status === STATUS.LOADING;
  const isSuccess = status === STATUS.SUCCESS && data !== null;

  if (status === STATUS.IDLE) return null;

  return (
    <section
      className={styles.results}
      aria-live="polite"
      aria-busy={isLoading}
    >
      {isLoading && <Skeleton />}

      {status === STATUS.ERROR && (
        <StatusPanel
          overline="STATE · ERROR"
          icon={TriangleAlert}
          variant="error"
          title="Something went wrong."
          body="We couldn’t reach the TVmaze API. Check your connection and give it another go."
          action={{
            icon: RotateCcw,
            label: 'Retry request',
            onClick: onRetry,
          }}
          actionAccent
        />
      )}

      {isSuccess && data.shows.length === 0 && (
        <StatusPanel
          overline="STATE · EMPTY"
          icon={SearchX}
          variant="empty"
          title="No shows found."
          body="Try another search. Check the spelling or explore a different title from the TVmaze catalogue."
          action={{ icon: Eraser, label: 'Clear search', onClick: onClear }}
        />
      )}

      {isSuccess && data.shows.length > 0 && (
        <>
          <ResultsHead
            totalCount={data.totalCount}
            genre={selection.genre}
            queryEcho={queryEcho}
          />

          <GenreFilter
            genres={data.genres}
            activeGenre={selection.genre}
            onSelectGenre={onGenreSelect}
          />

          <ShowList
            shows={data.shows}
            isDesktop={isDesktop}
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
          />

          <Pagination
            page={data.page}
            pageCount={data.pageCount}
            onSelectPage={onPageSelect}
          />
        </>
      )}
    </section>
  );
};
