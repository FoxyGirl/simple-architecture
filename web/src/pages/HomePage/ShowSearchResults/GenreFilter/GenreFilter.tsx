import clsx from 'clsx';

import { useGenreFilter } from './logic/useGenreFilter';

import styles from './GenreFilter.module.css';

type GenreFilterProps = {
  genres: string[];
  activeGenre: string;
  onSelectGenre: (genre: string) => void;
};

export const GenreFilter = (props: GenreFilterProps) => {
  const { genres, activeGenre, onSelectGenre } = props;
  const { chips } = useGenreFilter(genres);

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
            onClick={() => onSelectGenre(genre)}
          >
            {genre}
          </button>
        );
      })}
    </div>
  );
};
