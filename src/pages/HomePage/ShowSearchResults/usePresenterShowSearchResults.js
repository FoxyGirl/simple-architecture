import { useCallback, useState } from 'react';

import { RESULTS_PER_PAGE } from './constants.js';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const usePresenterShowSearchResults = ({ data }) => {
  // The selected page belongs to the result set it was made for, so a new
  // result set always starts on its first page.
  const [selection, setSelection] = useState({ data, page: 1 });

  const totalCount = data.length;
  const pageCount = Math.max(1, Math.ceil(totalCount / RESULTS_PER_PAGE));
  const page = clamp(
    selection.data === data ? selection.page : 1,
    1,
    pageCount,
  );

  const shows = data.slice(
    (page - 1) * RESULTS_PER_PAGE,
    page * RESULTS_PER_PAGE,
  );

  const selectPage = useCallback(
    (nextPage) => {
      setSelection({ data, page: clamp(nextPage, 1, pageCount) });
    },
    [data, pageCount],
  );

  const goToPrev = useCallback(() => {
    setSelection({ data, page: clamp(page - 1, 1, pageCount) });
  }, [data, page, pageCount]);

  const goToNext = useCallback(() => {
    setSelection({ data, page: clamp(page + 1, 1, pageCount) });
  }, [data, page, pageCount]);

  return {
    shows,
    totalCount,
    page,
    pageCount,
    selectPage,
    goToPrev,
    goToNext,
  };
};
