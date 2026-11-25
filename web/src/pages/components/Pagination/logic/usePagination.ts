type UsePaginationParams = {
  page: number;
  pageCount: number;
  onSelectPage: (page: number) => void;
};

export const usePagination = ({
  page,
  pageCount,
  onSelectPage,
}: UsePaginationParams) => ({
  pages: Array.from({ length: pageCount }, (_, index) => index + 1),
  isFirstPage: page === 1,
  isLastPage: page === pageCount,
  selectPage: onSelectPage,
  goToPrev: () => onSelectPage(Math.max(1, page - 1)),
  goToNext: () => onSelectPage(Math.min(pageCount, page + 1)),
});
