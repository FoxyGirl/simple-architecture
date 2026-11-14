import { useCallback, useMemo } from 'react';

import type { Show } from '@api/types';

import type { Selection, SelectionChange } from '../types';

import { collectGenres, resolveSelection } from '../utils';

type UseGenreFilterParams = {
  data: Show[];
  selection: Selection;
  onSelectionChange: (change: SelectionChange) => void;
};

export const useGenreFilter = ({
  data,
  selection,
  onSelectionChange,
}: UseGenreFilterParams) => {
  const { genre: activeGenre } = resolveSelection(selection, data);

  const genres = useMemo(() => collectGenres(data), [data]);

  const selectGenre = useCallback(
    (genre: string) => {
      // Changing the filter invalidates the current page.
      onSelectionChange({ data, genre, page: 1 });
    },
    [data, onSelectionChange],
  );

  return { genres, activeGenre, selectGenre };
};
