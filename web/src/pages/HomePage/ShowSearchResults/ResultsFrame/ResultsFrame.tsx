import type { SearchPage, Show } from '~/types';

import type { Selection } from '../../types';

import { Pagination } from '../../../components/Pagination';
import { ShowList } from '../../../components/ShowList';
import { SkeletonCards } from '../../../components/SkeletonCards';

import { RESULTS_PER_PAGE } from '../constants';
import { GenreFilter } from '../GenreFilter';
import { ResultsHead } from '../ResultsHead';

type ResultsFrameProps = {
  data: SearchPage;
  selection: Selection;
  queryEcho: string;
  isSelectionLoad: boolean;
  isFavorite: (showId: number) => boolean;
  onGenreSelect: (genre: string) => void;
  onPageSelect: (page: number) => void;
  onToggleFavorite: (show: Show) => void;
};

/**
 * The stable frame of a loaded result: head, genre filter, cards and
 * pagination. During a selection load the frame renders the stored page —
 * the new genre and the selected page are taken from the URL selection
 * immediately — and only the cards are replaced by skeletons.
 */
export const ResultsFrame = ({
  data,
  selection,
  queryEcho,
  isSelectionLoad,
  isFavorite,
  onGenreSelect,
  onPageSelect,
  onToggleFavorite,
}: ResultsFrameProps) => (
  <>
    <ResultsHead
      totalCount={data.totalCount}
      genre={selection.genre}
      queryEcho={queryEcho}
    />

    <GenreFilter
      genres={data.genres}
      activeGenre={selection.genre}
      onSelectGenre={onGenreSelect}
    />

    {isSelectionLoad ? (
      <SkeletonCards count={RESULTS_PER_PAGE} />
    ) : (
      <ShowList
        shows={data.shows}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
      />
    )}

    <Pagination
      page={isSelectionLoad ? selection.page : data.page}
      pageCount={data.pageCount}
      onSelectPage={onPageSelect}
    />
  </>
);
