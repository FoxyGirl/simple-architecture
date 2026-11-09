import clsx from 'clsx';

import styles from './GenreFilter.module.css';

export const GenreFilter = ({ genres, activeGenre, onSelectGenre }) => (
  <div className={styles.filter} role="group" aria-label="Filter by genre">
    {genres.map((genre) => {
      const isActive = genre === activeGenre;

      return (
        <button
          key={genre}
          className={clsx(styles.chip, { [styles.chipActive]: isActive })}
          type="button"
          aria-pressed={isActive}
          onClick={() => onSelectGenre(genre)}
        >
          {genre}
        </button>
      );
    })}
  </div>
);
