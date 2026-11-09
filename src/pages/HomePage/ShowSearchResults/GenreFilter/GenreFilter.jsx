import clsx from 'clsx';

import { usePresenterGenreFilter } from './usePresenterGenreFilter.js';

import styles from './GenreFilter.module.css';

export const GenreFilter = ({ data, selection, onSelectionChange }) => {
  const { genres, activeGenre, selectGenre } = usePresenterGenreFilter({
    data,
    selection,
    onSelectionChange,
  });

  return (
    <div className={styles.filter} role="group" aria-label="Filter by genre">
      {genres.map((genre) => {
        const isActive = genre === activeGenre;

        return (
          <button
            key={genre}
            className={clsx(styles.chip, { [styles.chipActive]: isActive })}
            type="button"
            aria-pressed={isActive}
            onClick={() => selectGenre(genre)}
          >
            {genre}
          </button>
        );
      })}
    </div>
  );
};
