import { useMediaQuery } from '@hooks/useMediaQuery';

import { useResultsHead } from './logic/useResultsHead';

import styles from './ResultsHead.module.css';

type ResultsHeadProps = {
  totalCount: number;
  genre: string;
  queryEcho: string;
};

export const ResultsHead = (props: ResultsHeadProps) => {
  const { countLabel, compactCountLabel, resultsEcho } = useResultsHead(props);

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
