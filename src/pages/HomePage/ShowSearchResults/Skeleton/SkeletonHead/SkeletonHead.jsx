import styles from './SkeletonHead.module.css';

export const SkeletonHead = () => (
  <div className={styles.head} aria-hidden="true">
    <div className={styles.headLeft}>
      <div className={styles.titleBar} />
      <div className={styles.countPill} />
    </div>

    <div className={styles.echoBar} />
  </div>
);
