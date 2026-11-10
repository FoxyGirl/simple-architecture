import { Eraser, RotateCcw, SearchX, TriangleAlert } from 'lucide-react';

import { useMediaQuery } from '@hooks/useMediaQuery.js';
import { STATUS } from '../constants.js';

import { GenreFilter } from './GenreFilter/GenreFilter';
import { Pagination } from './Pagination/Pagination';
import { ResultsHead } from './ResultsHead/ResultsHead';
import { ShowCard } from './ShowCard/ShowCard';
import { ShowRowCard } from './ShowRowCard/ShowRowCard';
import { Skeleton } from './Skeleton/Skeleton';
import { StatusPanel } from './StatusPanel/StatusPanel';
import { usePresenterShowSearchResults } from './usePresenterShowSearchResults.js';

import styles from './ShowSearchResults.module.css';

export const ShowSearchResults = ({
  data,
  status,
  queryEcho,
  onRetry,
  onClear,
}) => {
  const { shows, selection, onSelectionChange } = usePresenterShowSearchResults(
    { data },
  );

  const { isDesktop } = useMediaQuery();

  const isLoading = status === STATUS.LOADING;

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

      {status === STATUS.SUCCESS && shows.length === 0 && (
        <StatusPanel
          overline="STATE · EMPTY"
          icon={SearchX}
          variant="empty"
          title="No shows found."
          body="Try another search. Check the spelling or explore a different title from the TVmaze catalogue."
          action={{ icon: Eraser, label: 'Clear search', onClick: onClear }}
        />
      )}

      {status === STATUS.SUCCESS && shows.length > 0 && (
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
