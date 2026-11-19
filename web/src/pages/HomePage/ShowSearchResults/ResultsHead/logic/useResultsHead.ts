import { pluralize } from '../../../../utils';

import { ALL_GENRES } from '../../constants';

type UseResultsHeadParams = {
  totalCount: number;
  genre: string;
  queryEcho: string;
};

export const useResultsHead = ({
  totalCount,
  genre,
  queryEcho,
}: UseResultsHeadParams) => {
  const showWord = pluralize(totalCount, 'show');
  const countLabel = `${totalCount} ${showWord} found`;
  const compactCountLabel = `${totalCount} ${showWord}`;
  const resultsEcho = {
    query: `for “${queryEcho}”`,
    filter: genre === ALL_GENRES ? null : `filtered by ${genre}`,
  };

  return { countLabel, compactCountLabel, resultsEcho };
};
