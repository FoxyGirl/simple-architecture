import { Sparkles } from 'lucide-react';

import { useHomePage } from './useHomePage';

import { ShowSearchResults } from './ShowSearchResults';
import { ShowsSearchField } from './ShowsSearchField';

import styles from './HomePage.module.css';

export const HomePage = () => {
  const {
    data,
    queryEcho,
    status,
    selection,
    retry,
    clearSearch,
    onSearchChange,
    registerControls,
    submitSearch,
    isCurrentQuery,
    abortSearch,
    selectGenre,
    selectPage,
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
          submitSearch={submitSearch}
          isCurrentQuery={isCurrentQuery}
          abortSearch={abortSearch}
        />
      </section>

      <ShowSearchResults
        data={data}
        status={status}
        queryEcho={queryEcho}
        selection={selection}
        onGenreSelect={selectGenre}
        onPageSelect={selectPage}
        onRetry={retry}
        onClear={clearSearch}
      />
    </>
  );
};
