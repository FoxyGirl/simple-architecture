import { Sparkles } from 'lucide-react';

import { useHomePage } from './useHomePage.js';

import { ShowSearchResults } from './ShowSearchResults';
import { ShowsSearchField } from './ShowsSearchField';

import styles from './HomePage.module.css';

export const HomePage = () => {
  const {
    data,
    queryEcho,
    status,
    retry,
    clearSearch,
    onSearchChange,
    registerControls,
  } = useHomePage();

  return (
    <>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>
          <Sparkles
            className={styles.eyebrowIcon}
            size={13}
            aria-hidden="true"
          />
          <span>LIVE CATALOGUE · TVMAZE</span>
        </p>

        <h1 className={styles.headline}>Discover your next obsession.</h1>

        <p className={styles.subhead}>
          Explore thousands of TV shows and find something worth watching.
        </p>

        <ShowsSearchField
          onSearchChange={onSearchChange}
          registerControls={registerControls}
        />
      </section>

      <ShowSearchResults
        data={data}
        status={status}
        queryEcho={queryEcho}
        onRetry={retry}
        onClear={clearSearch}
      />
    </>
  );
};
