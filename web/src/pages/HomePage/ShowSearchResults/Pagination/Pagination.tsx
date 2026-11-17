import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { useMediaQuery } from '@hooks/useMediaQuery';

import { usePagination } from './usePagination';

import { ArrowButton } from './ArrowButton';

import styles from './Pagination.module.css';

type PaginationProps = {
  page: number;
  pageCount: number;
  onSelectPage: (page: number) => void;
};

export const Pagination = ({
  page,
  pageCount,
  onSelectPage,
}: PaginationProps) => {
  const { pages, isFirstPage, isLastPage, selectPage, goToPrev, goToNext } =
    usePagination({ page, pageCount, onSelectPage });

  const { isDesktop } = useMediaQuery();

  const prevButton = (
    <ArrowButton
      label="Previous page"
      icon={ChevronLeft}
      disabled={isFirstPage}
      onClick={goToPrev}
    />
  );

  const nextButton = (
    <ArrowButton
      label="Next page"
      icon={ChevronRight}
      disabled={isLastPage}
      onClick={goToNext}
    />
  );

  const pageInfo = (
    <span className={styles.pageInfo}>
      Page {page} of {pageCount}
    </span>
  );

  return (
    <nav className={styles.pagination} aria-label="Pagination">
      {prevButton}

      {isDesktop ? (
        <>
          {pages.map((pageNumber) => (
            <button
              key={pageNumber}
              className={clsx(styles.pageButton, {
                [styles.pageButtonActive]: pageNumber === page,
              })}
              type="button"
              onClick={() => selectPage(pageNumber)}
              aria-current={pageNumber === page ? 'page' : undefined}
            >
              {pageNumber}
            </button>
          ))}

          {nextButton}
          {pageInfo}
        </>
      ) : (
        <>
          {pageInfo}
          {nextButton}
        </>
      )}
    </nav>
  );
};
