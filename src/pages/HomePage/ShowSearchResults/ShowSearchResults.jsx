import { Eraser, RotateCcw, SearchX, TriangleAlert } from 'lucide-react';

import { useMediaQuery } from '@hooks/useMediaQuery.js';
import { STATUS } from '../constants.js';

import { useShowSearchResults } from './useShowSearchResults.js';

import { GenreFilter } from './GenreFilter';
import { Pagination } from './Pagination';
import { ResultsHead } from './ResultsHead';
import { ShowCard } from './ShowCard';
import { ShowRowCard } from './ShowRowCard';
import { Skeleton } from './Skeleton';
import { StatusPanel } from './StatusPanel';

import styles from './ShowSearchResults.module.css';

export const ShowSearchResults = ({
  data,
  status,
  queryEcho,
  onRetry,
  onClear,
}) => {
  const { shows, selection, onSelectionChange } = useShowSearchResults({
    data,
  });

  const { isDesktop } = useMediaQuery();

  const isLoading = status === STATUS.LOADING;
  const isSuccess = status === STATUS.SUCCESS;

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

      {isSuccess && shows.length === 0 && (
        <StatusPanel
          overline="STATE · EMPTY"
          icon={SearchX}
          variant="empty"
          title="No shows found."
          body="Try another search. Check the spelling or explore a different title from the TVmaze catalogue."
          action={{ icon: Eraser, label: 'Clear search', onClick: onClear }}
        />
      )}

      {isSuccess && shows.length > 0 && (
        <>
          <ResultsHead
            data={data}
            selection={selection}
            queryEcho={queryEcho}
          />

          <GenreFilter
            data={data}
            selection={selection}
            onSelectionChange={onSelectionChange}
          />

          <div className={styles.list}>
            {shows.map((show) =>
              isDesktop ? (
                <ShowCard key={show.id} show={show} />
              ) : (
                <ShowRowCard key={show.id} show={show} />
              ),
            )}
          </div>

          <Pagination
            data={data}
            selection={selection}
            onSelectionChange={onSelectionChange}
          />
        </>
      )}
    </section>
  );
};
