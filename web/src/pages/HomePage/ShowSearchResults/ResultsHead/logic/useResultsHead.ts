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
  const countLabel = `${totalCount} ${totalCount === 1 ? 'show' : 'shows'} found`;
  const compactCountLabel = `${totalCount} ${totalCount === 1 ? 'show' : 'shows'}`;
  const resultsEcho = {
    query: `for “${queryEcho}”`,
    filter: genre === ALL_GENRES ? null : `filtered by ${genre}`,
  };

  return { countLabel, compactCountLabel, resultsEcho };
};
