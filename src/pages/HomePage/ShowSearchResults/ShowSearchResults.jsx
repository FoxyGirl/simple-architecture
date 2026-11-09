import { Eraser, RotateCcw, SearchX, TriangleAlert } from 'lucide-react';

import { useMediaQuery } from '../../../hooks/useMediaQuery.js';
import { ShowCard } from './ShowCard/ShowCard';
import { ShowRowCard } from './ShowRowCard/ShowRowCard';
import { SkeletonCard } from './SkeletonCard/SkeletonCard';
import { StatusPanel } from './StatusPanel/StatusPanel';

import styles from './ShowSearchResults.module.css';

const SKELETON_COUNT = 6;

export const ShowSearchResults = ({
  data,
  status,
  queryEcho,
  onRetry,
  onClear,
}) => {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  if (status === 'idle') return null;

  return (
    <section className={styles.results} aria-live="polite">
      {status === 'loading' && (
        <div className={styles.list}>
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      )}

      {status === 'error' && (
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

      {status === 'success' && data.length === 0 && (
        <StatusPanel
          overline="STATE · EMPTY"
          icon={SearchX}
          variant="empty"
          title="No shows found."
          body="Try another search. Check the spelling or explore a different title from the TVmaze catalogue."
          action={{ icon: Eraser, label: 'Clear search', onClick: onClear }}
        />
      )}

      {status === 'success' && data.length > 0 && (
        <>
          <div className={styles.head}>
            <div className={styles.headLeft}>
              <h2 className={styles.title}>Search Results</h2>
              <span className={styles.countPill}>
                {data.length} {data.length === 1 ? 'show' : 'shows'} found
              </span>
            </div>

            <p className={styles.queryEcho}>for “{queryEcho}”</p>
          </div>

          <div className={styles.list}>
            {data.map((show) =>
              isDesktop ? (
                <ShowCard key={show.id} show={show} />
              ) : (
                <ShowRowCard key={show.id} show={show} />
              ),
            )}
          </div>
        </>
      )}
    </section>
  );
};
