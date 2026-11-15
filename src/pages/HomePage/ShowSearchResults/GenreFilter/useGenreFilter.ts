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

  const genres = collectGenres(data);

  const selectGenre = (genre: string) => {
    // Changing the filter invalidates the current page.
    onSelectionChange({ data: data, genre, page: 1 });
  };

  return { genres, activeGenre, selectGenre };
};
