import type { Show } from '@api/types';

import type { Selection, SelectionChange } from '../types';

import {
  clampPage,
  filterShowsByGenre,
  getPageCount,
  resolveSelection,
} from '../utils';

type UsePaginationParams = {
  data: Show[];
  selection: Selection;
  onSelectionChange: (change: SelectionChange) => void;
};

export const usePagination = ({
  data,
  selection,
  onSelectionChange,
}: UsePaginationParams) => {
  const resolved = resolveSelection(selection, data);
  const genre = resolved.genre;
  const matching = filterShowsByGenre(data, genre);
  const pageCount = getPageCount(matching.length);
  const page = clampPage(resolved.page, pageCount);
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);

  const selectPage = (nextPage: number) => {
    onSelectionChange({ data, genre, page: clampPage(nextPage, pageCount) });
  };

  const goToPrev = () => {
    onSelectionChange({ data, genre, page: clampPage(page - 1, pageCount) });
  };

  const goToNext = () => {
    onSelectionChange({ data, genre, page: clampPage(page + 1, pageCount) });
  };

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
