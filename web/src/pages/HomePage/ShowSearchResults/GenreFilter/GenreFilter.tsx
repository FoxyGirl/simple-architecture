import clsx from 'clsx';

import type { Show } from '@api/types';

import type { Selection, SelectionChange } from '../types';

import { useGenreFilter } from './useGenreFilter';

import styles from './GenreFilter.module.css';

type GenreFilterProps = {
  data: Show[];
  selection: Selection;
  onSelectionChange: (change: SelectionChange) => void;
};

export const GenreFilter = (props: GenreFilterProps) => {
  const { genres, activeGenre, selectGenre } = useGenreFilter(props);

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
