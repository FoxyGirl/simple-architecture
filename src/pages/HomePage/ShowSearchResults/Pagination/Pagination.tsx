import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { Show } from '@api/types';
import { useMediaQuery } from '@hooks/useMediaQuery';

import type { Selection, SelectionChange } from '../types';

import { usePagination } from './usePagination';

import { ArrowButton } from './ArrowButton';

import styles from './Pagination.module.css';

interface PaginationProps {
  data: Show[];
  selection: Selection;
  onSelectionChange: (change: SelectionChange) => void;
}

export const Pagination = ({
  data,
  selection,
  onSelectionChange,
}: PaginationProps) => {
  const {
    page,
    pageCount,
    pages,
    isFirstPage,
    isLastPage,
    selectPage,
    goToPrev,
    goToNext,
  } = usePagination({ data, selection, onSelectionChange });

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
              className={clsx(
                styles.pageButton,
                pageNumber === page && styles.pageButtonActive,
              )}
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
