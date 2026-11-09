import { useCallback, useMemo, useState } from 'react';

import { ALL_GENRES, RESULTS_PER_PAGE } from './constants.js';
import { collectGenres, filterShowsByGenre } from './genres.js';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const usePresenterShowSearchResults = ({ data, queryEcho }) => {
  // The selection belongs to the result set it was made for, so a new result
  // set always starts unfiltered and on its first page.
  const [selection, setSelection] = useState({
    data: null,
    genre: ALL_GENRES,
    page: 1,
  });

  const isCurrent = selection.data === data;
  const activeGenre = isCurrent ? selection.genre : ALL_GENRES;

  const genres = useMemo(() => collectGenres(data), [data]);
  const matching = useMemo(
    () => filterShowsByGenre(data, activeGenre),
    [data, activeGenre],
  );

  const totalCount = matching.length;
  const pageCount = Math.max(1, Math.ceil(totalCount / RESULTS_PER_PAGE));
  const page = clamp(isCurrent ? selection.page : 1, 1, pageCount);
  const shows = matching.slice(
    (page - 1) * RESULTS_PER_PAGE,
    page * RESULTS_PER_PAGE,
  );

  const countLabel = `${totalCount} ${totalCount === 1 ? 'show' : 'shows'} found`;
  const resultsEcho =
    activeGenre === ALL_GENRES
      ? `for “${queryEcho}”`
      : `for “${queryEcho}” · filtered by ${activeGenre}`;

  const selectGenre = useCallback(
    (genre) => {
      setSelection({ data, genre, page: 1 });
    },
    [data],
  );

  const selectPage = useCallback(
    (nextPage) => {
      setSelection({
        data,
        genre: activeGenre,
        page: clamp(nextPage, 1, pageCount),
      });
    },
    [data, activeGenre, pageCount],
  );

  const goToPrev = useCallback(() => {
    setSelection({
      data,
      genre: activeGenre,
      page: clamp(page - 1, 1, pageCount),
    });
  }, [data, activeGenre, page, pageCount]);

  const goToNext = useCallback(() => {
    setSelection({
      data,
      genre: activeGenre,
      page: clamp(page + 1, 1, pageCount),
    });
  }, [data, activeGenre, page, pageCount]);

  return {
    shows,
    totalCount,
    page,
    pageCount,
    genres,
    activeGenre,
    countLabel,
    resultsEcho,
    selectGenre,
    selectPage,
    goToPrev,
    goToNext,
  };
};
