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
  const resolved = resolveSelection(selection, data);
  const genre = resolved.genre;
  const totalCount = filterShowsByGenre(data, genre).length;

  const countLabel = `${totalCount} ${totalCount === 1 ? 'show' : 'shows'} found`;
  const compactCountLabel = `${totalCount} ${totalCount === 1 ? 'show' : 'shows'}`;
  const resultsEcho = {
    query: `for “${queryEcho}”`,
    filter: genre === ALL_GENRES ? null : `filtered by ${genre}`,
  };

  return { countLabel, compactCountLabel, resultsEcho };
};
