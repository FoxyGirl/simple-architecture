import { useMediaQuery } from '@hooks/useMediaQuery.js';

import { usePresenterResultsHead } from './usePresenterResultsHead.js';

import styles from './ResultsHead.module.css';

export const ResultsHead = ({ data, selection, queryEcho }) => {
  const { countLabel, compactCountLabel, resultsEcho } =
    usePresenterResultsHead({
      data,
      selection,
      queryEcho,
    });

  const { isDesktop } = useMediaQuery();

  return (
    <div className={styles.head}>
      <div className={styles.headLeft}>
        <h2 className={styles.title}>Search Results</h2>
        <span className={styles.countPill}>
          {isDesktop ? countLabel : compactCountLabel}
        </span>
      </div>

      <p className={styles.queryEcho}>
        {resultsEcho.query}
        {resultsEcho.filter ? ` · ${resultsEcho.filter}` : ''}
      </p>
    </div>
  );
};
