import { ChevronLeft, ChevronRight } from 'lucide-react';

import { useMediaQuery } from '@hooks/useMediaQuery.js';

import { ArrowButton } from './ArrowButton/ArrowButton';

import styles from './Pagination.module.css';

export const Pagination = ({
  page,
  pageCount,
  onSelectPage,
  onPrev,
  onNext,
}) => {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);

  const prevButton = (
    <ArrowButton
      label="Previous page"
      icon={ChevronLeft}
      disabled={page === 1}
      onClick={onPrev}
    />
  );

  const nextButton = (
    <ArrowButton
      label="Next page"
      icon={ChevronRight}
      disabled={page === pageCount}
      onClick={onNext}
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
              className={
                pageNumber === page
                  ? `${styles.pageButton} ${styles.pageButtonActive}`
                  : styles.pageButton
              }
              type="button"
              onClick={() => onSelectPage(pageNumber)}
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
