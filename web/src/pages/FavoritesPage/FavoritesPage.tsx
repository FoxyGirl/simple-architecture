import { ArrowLeft, Heart, HeartOff } from 'lucide-react';

import { useFavoritesPage } from './logic/useFavoritesPage';

import { FavoriteShowCard } from './FavoriteShowCard';

import styles from './FavoritesPage.module.css';

export const FavoritesPage = () => {
  const { favorites, removeFromFavorites, goToCatalogue } = useFavoritesPage();

  return (
    <section className={styles.page}>
      <header className={styles.head}>
        <p className={styles.eyebrow}>
          <Heart className={styles.eyebrowIcon} size={13} aria-hidden="true" />
          <span>YOUR LIST</span>
        </p>

        <h1 className={styles.headline}>Favorites</h1>

        <p className={styles.subhead}>
          {favorites.length === 0
            ? 'Shows you mark with the heart button live here.'
            : `${favorites.length} ${
                favorites.length === 1 ? 'show' : 'shows'
              } saved to your list.`}
        </p>
      </header>

      {favorites.length === 0 ? (
        <div className={styles.empty} aria-live="polite">
          <HeartOff className={styles.emptyIcon} size={40} aria-hidden="true" />
          <p className={styles.emptyText}>
            No favorites yet. Browse the catalogue and tap the heart on a show
            to keep it here.
          </p>
          <button
            type="button"
            className={styles.browseButton}
            onClick={goToCatalogue}
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Browse shows
          </button>
        </div>
      ) : (
        <div className={styles.list} aria-live="polite">
          {favorites.map((show) => (
            <FavoriteShowCard
              key={show.id}
              show={show}
              onRemove={() => removeFromFavorites(show)}
            />
          ))}
        </div>
      )}
    </section>
  );
};
