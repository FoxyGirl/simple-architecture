import clsx from 'clsx';

import type { Show } from '@api/types';

import type { Selection, SelectionChange } from '../types';

import { useGenreFilter } from './useGenreFilter';

import styles from './GenreFilter.module.css';

interface GenreFilterProps {
  data: Show[];
  selection: Selection;
  onSelectionChange: (change: SelectionChange) => void;
}

export const GenreFilter = ({
  data,
  selection,
  onSelectionChange,
}: GenreFilterProps) => {
  const { genres, activeGenre, selectGenre } = useGenreFilter({
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
            className={clsx(styles.chip, isActive && styles.chipActive)}
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
