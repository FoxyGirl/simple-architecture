import { ArrowLeft, Heart, HeartOff } from 'lucide-react';

import { useFavoritesPage } from './logic/useFavoritesPage';

import { Pagination } from '../components/Pagination';
import { ShowList } from '../components/ShowList';
import { SkeletonCards } from '../components/SkeletonCards';

import { RESULTS_PER_PAGE } from './constants';

import styles from './FavoritesPage.module.css';

export const FavoritesPage = () => {
  const {
    shows,
    page,
    pageCount,
    isLoading,
    subHeadText,
    isFavorite,
    isRemoved,
    toggleFavorite,
    selectPage,
    goToHome,
  } = useFavoritesPage();

  return (
    <section className={styles.page}>
      <header className={styles.head}>
        <button type="button" className={styles.backButton} onClick={goToHome}>
          <ArrowLeft size={15} aria-hidden="true" />
          Back to Home
        </button>

        <p className={styles.eyebrow}>
          <Heart className={styles.eyebrowIcon} size={13} aria-hidden="true" />
          <span>YOUR LIST</span>
        </p>

        <h1 className={styles.headline}>Favorites</h1>

        <p className={styles.subhead}>{subHeadText}</p>
      </header>

      {!isLoading && shows?.length === 0 && (
        <div className={styles.empty} aria-live="polite">
          <HeartOff className={styles.emptyIcon} size={40} aria-hidden="true" />
          <p className={styles.emptyText}>
            No favorites yet. Browse the catalogue and tap the heart on a show
            to keep it here.
          </p>
          <button
            type="button"
            className={styles.browseButton}
            onClick={goToHome}
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Browse shows
          </button>
        </div>
      )}

      {(isLoading || shows !== null) && (
        <>
          <div aria-live="polite">
            {isLoading ? (
              <SkeletonCards count={RESULTS_PER_PAGE} />
            ) : (
              <ShowList
                shows={shows || []}
                isFavorite={isFavorite}
                isRemoved={isRemoved}
                onToggleFavorite={toggleFavorite}
              />
            )}
          </div>

          {shows !== null && shows.length > 0 && (
            <Pagination
              page={page}
              pageCount={pageCount}
              onSelectPage={selectPage}
            />
          )}
        </>
      )}
    </section>
  );
};
