import { Eraser, RotateCcw, SearchX, TriangleAlert } from 'lucide-react';

import { useMediaQuery } from '@hooks/useMediaQuery.js';
import { STATUS } from '../constants.js';
import { RESULTS_PER_PAGE } from './constants.js';

import { GenreFilter } from './GenreFilter/GenreFilter';
import { Pagination } from './Pagination/Pagination';
import { ResultsHead } from './ResultsHead/ResultsHead';
import { ShowCard } from './ShowCard/ShowCard';
import { ShowRowCard } from './ShowRowCard/ShowRowCard';
import { SkeletonCard } from './SkeletonCard/SkeletonCard';
import { StatusPanel } from './StatusPanel/StatusPanel';
import { usePresenterShowSearchResults } from './usePresenterShowSearchResults.js';

import styles from './ShowSearchResults.module.css';

const SKELETON_COUNT = RESULTS_PER_PAGE;

export const ShowSearchResults = ({
  data,
  status,
  queryEcho,
  onRetry,
  onClear,
}) => {
  const {
    shows,
    totalCount,
    page,
    pageCount,
    genres,
    activeGenre,
    countLabel,
    compactCountLabel,
    resultsEcho,
    selectGenre,
    selectPage,
    goToPrev,
    goToNext,
  } = usePresenterShowSearchResults({ data, queryEcho });

  const isDesktop = useMediaQuery('(min-width: 1024px)');

  if (status === STATUS.IDLE) return null;

  return (
    <section className={styles.results} aria-live="polite">
      {status === STATUS.LOADING && (
        <div className={styles.list}>
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      )}

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

      {status === STATUS.SUCCESS && totalCount === 0 && (
        <StatusPanel
          overline="STATE · EMPTY"
          icon={SearchX}
          variant="empty"
          title="No shows found."
          body="Try another search. Check the spelling or explore a different title from the TVmaze catalogue."
          action={{ icon: Eraser, label: 'Clear search', onClick: onClear }}
        />
      )}

      {status === STATUS.SUCCESS && totalCount > 0 && (
        <>
          <ResultsHead
            countLabel={countLabel}
            compactCountLabel={compactCountLabel}
            resultsEcho={resultsEcho}
          />

          <GenreFilter
            genres={genres}
            activeGenre={activeGenre}
            onSelectGenre={selectGenre}
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
            page={page}
            pageCount={pageCount}
            onSelectPage={selectPage}
            onPrev={goToPrev}
            onNext={goToNext}
          />
        </>
      )}
    </section>
  );
};
