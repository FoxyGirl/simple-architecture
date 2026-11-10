import { useCallback, useMemo } from 'react';

import { filterShowsByGenre } from '../utils/genres.js';
import { clampPage, getPageCount } from '../utils/pagination.js';
import { resolveSelection } from '../utils/selection.js';

export const usePresenterPagination = ({
  data,
  selection,
  onSelectionChange,
}) => {
  const { genre, page, pageCount } = useMemo(() => {
    const resolved = resolveSelection(selection, data);
    const matching = filterShowsByGenre(data, resolved.genre);
    const count = getPageCount(matching.length);

    return {
      genre: resolved.genre,
      page: clampPage(resolved.page, count),
      pageCount: count,
    };
  }, [selection, data]);

  const pages = useMemo(
    () => Array.from({ length: pageCount }, (_, index) => index + 1),
    [pageCount],
  );

  const selectPage = useCallback(
    (nextPage) => {
      onSelectionChange({ data, genre, page: clampPage(nextPage, pageCount) });
    },
    [data, genre, pageCount, onSelectionChange],
  );

  const goToPrev = useCallback(() => {
    onSelectionChange({ data, genre, page: clampPage(page - 1, pageCount) });
  }, [data, genre, page, pageCount, onSelectionChange]);

  const goToNext = useCallback(() => {
    onSelectionChange({ data, genre, page: clampPage(page + 1, pageCount) });
  }, [data, genre, page, pageCount, onSelectionChange]);

  return {
    page,
    pageCount,
    pages,
    isFirstPage: page === 1,
    isLastPage: page === pageCount,
    selectPage,
    goToPrev,
    goToNext,
  };
};
