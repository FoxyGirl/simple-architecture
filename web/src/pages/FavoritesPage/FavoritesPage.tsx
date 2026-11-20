import { ArrowLeft, Heart, HeartOff } from 'lucide-react';

import { useFavoritesPage } from './logic/useFavoritesPage';

import { Pagination } from '../components/Pagination';
import { ShowList } from '../components/ShowList';

import styles from './FavoritesPage.module.css';

export const FavoritesPage = () => {
  const {
    list,
    subHeadText,
    isFavorite,
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

      {list !== null && list.shows.length === 0 && (
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

      {list !== null && list.shows.length > 0 && (
        <>
          <div aria-live="polite">
            <ShowList
              shows={list.shows}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
            />
          </div>

          <Pagination
            page={list.page}
            pageCount={list.pageCount}
            onSelectPage={selectPage}
          />
        </>
      )}
    </section>
  );
};
