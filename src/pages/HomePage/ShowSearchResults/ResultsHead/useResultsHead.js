import { useMemo } from 'react';

import { ALL_GENRES } from '../constants.js';
import { filterShowsByGenre, resolveSelection } from '../utils';

export const useResultsHead = ({ data, selection, queryEcho }) => {
  const { genre, totalCount } = useMemo(() => {
    const resolved = resolveSelection(selection, data);

    return {
      genre: resolved.genre,
      totalCount: filterShowsByGenre(data, resolved.genre).length,
    };
  }, [selection, data]);

  const countLabel = `${totalCount} ${totalCount === 1 ? 'show' : 'shows'} found`;
  const compactCountLabel = `${totalCount} ${totalCount === 1 ? 'show' : 'shows'}`;
  const resultsEcho = {
    query: `for “${queryEcho}”`,
    filter: genre === ALL_GENRES ? null : `filtered by ${genre}`,
  };

  return { countLabel, compactCountLabel, resultsEcho };
};
