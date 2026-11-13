import styles from './SkeletonFilter.module.css';

const CHIP_COUNT = 6;

export const SkeletonFilter = () => (
  <div className={styles.filter} role="presentation" aria-hidden="true">
    {Array.from({ length: CHIP_COUNT }, (_, index) => (
      <div key={index} className={styles.chip} />
    ))}
  </div>
);
