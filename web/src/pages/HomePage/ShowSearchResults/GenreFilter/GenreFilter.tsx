import clsx from 'clsx';

import { useGenreFilter } from './useGenreFilter';

import styles from './GenreFilter.module.css';

type GenreFilterProps = {
  genres: string[];
  activeGenre: string;
  onSelectGenre: (genre: string) => void;
};

export const GenreFilter = (props: GenreFilterProps) => {
  const { chips, activeGenre, selectGenre } = useGenreFilter(props);

  return (
    <div className={styles.filter} role="group" aria-label="Filter by genre">
      {chips.map((genre) => {
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
