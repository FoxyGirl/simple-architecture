import { Sparkles } from 'lucide-react';

import { ShowSearchResults } from './ShowSearchResults/ShowSearchResults';
import { ShowsSearchField } from './ShowsSearchField/ShowsSearchField';
import { usePresenterSearch } from './ShowsSearchField/usePresenterSearch.js';

import styles from './HomePage.module.css';

export const HomePage = () => {
  const {
    query,
    results,
    status,
    handleSearch,
    clearQuery,
    clearSearch,
    retry,
  } = usePresenterSearch();

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
          query={query}
          onChange={handleSearch}
          onClear={clearQuery}
        />
      </section>

      <ShowSearchResults
        results={results}
        status={status}
        query={query}
        onRetry={retry}
        onClear={clearSearch}
      />
    </>
  );
};
