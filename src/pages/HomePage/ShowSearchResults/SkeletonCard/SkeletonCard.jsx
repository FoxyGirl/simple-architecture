import { useMediaQuery } from '../../../../hooks/useMediaQuery.js';

import styles from './SkeletonCard.module.css';

export const SkeletonCard = () => {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  if (!isDesktop) {
    return (
      <div className={styles.row} aria-hidden="true">
        <div className={styles.rowPoster} />
        <div className={styles.rowInfo}>
          <div className={`${styles.bar} ${styles.barTitle}`} />
          <div className={`${styles.bar} ${styles.barMedium}`} />
          <div className={`${styles.bar} ${styles.barShort}`} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card} aria-hidden="true">
      <div className={styles.poster} />
      <div className={styles.info}>
        <div className={styles.titleBlock}>
          <div className={`${styles.bar} ${styles.barTitle}`} />
          <div className={`${styles.bar} ${styles.barTitleShort}`} />
        </div>
        <div className={styles.metaRow}>
          <div className={`${styles.bar} ${styles.barMedium}`} />
        </div>
        <div className={styles.genresRow}>
          <div className={`${styles.bar} ${styles.barShort}`} />
        </div>
      </div>
    </div>
  );
};
