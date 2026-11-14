import { useMemo } from 'react';

import type { Show } from '@api/types';

import type { Selection } from '../types';

import { ALL_GENRES } from '../constants';
import { filterShowsByGenre, resolveSelection } from '../utils';

type UseResultsHeadParams = {
  data: Show[];
  selection: Selection;
  queryEcho: string;
};

export const useResultsHead = ({
  data,
  selection,
  queryEcho,
}: UseResultsHeadParams) => {
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
