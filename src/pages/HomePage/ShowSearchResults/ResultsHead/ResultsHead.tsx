import type { Show } from '@api/types';
import { useMediaQuery } from '@hooks/useMediaQuery';

import type { Selection } from '../types';

import { useResultsHead } from './useResultsHead';

import styles from './ResultsHead.module.css';

type ResultsHeadProps = {
  data: Show[];
  selection: Selection;
  queryEcho: string;
};

export const ResultsHead = ({
  data,
  selection,
  queryEcho,
}: ResultsHeadProps) => {
  const { countLabel, compactCountLabel, resultsEcho } = useResultsHead({
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
