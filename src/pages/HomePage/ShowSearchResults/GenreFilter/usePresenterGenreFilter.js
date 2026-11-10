import { useCallback, useMemo } from 'react';

import { collectGenres } from '../utils/genres.js';
import { resolveSelection } from '../utils/selection.js';

export const usePresenterGenreFilter = ({
  data,
  selection,
  onSelectionChange,
}) => {
  const { genre: activeGenre } = resolveSelection(selection, data);

  const genres = useMemo(() => collectGenres(data), [data]);

  const selectGenre = useCallback(
    (genre) => {
      // Changing the filter invalidates the current page.
      onSelectionChange({ data, genre, page: 1 });
    },
    [data, onSelectionChange],
  );

  return { genres, activeGenre, selectGenre };
};
