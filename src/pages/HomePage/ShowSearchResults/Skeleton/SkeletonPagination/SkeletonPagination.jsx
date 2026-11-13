import { useMediaQuery } from '@hooks/useMediaQuery.js';

import styles from './SkeletonPagination.module.css';

const DESKTOP_PAGE_COUNT = 3;

export const SkeletonPagination = () => {
  const { isDesktop } = useMediaQuery();

  if (!isDesktop) {
    return (
      <div className={styles.pagination} aria-hidden="true">
        <span className={styles.info} />
        <div className={styles.arrow} />
      </div>
    );
  }

  return (
    <div className={styles.pagination} aria-hidden="true">
      <div className={styles.arrow} />

      {Array.from({ length: DESKTOP_PAGE_COUNT }, (_, index) => (
        <div key={index} className={styles.page} />
      ))}

      <div className={styles.arrow} />

      <span className={styles.info} />
    </div>
  );
};
