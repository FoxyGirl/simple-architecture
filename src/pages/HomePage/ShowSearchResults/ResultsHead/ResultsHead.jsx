import styles from './ResultsHead.module.css';

export const ResultsHead = ({ countLabel, resultsEcho }) => (
  <div className={styles.head}>
    <div className={styles.headLeft}>
      <h2 className={styles.title}>Search Results</h2>
      <span className={styles.countPill}>{countLabel}</span>
    </div>

    <p className={styles.queryEcho}>{resultsEcho}</p>
  </div>
);
