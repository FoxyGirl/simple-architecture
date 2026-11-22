import { Sparkles } from 'lucide-react';

import { useHomePage } from './logic/useHomePage';

import { ShowSearchResults } from './ShowSearchResults';
import { ShowsSearchField } from './ShowsSearchField';
import { FavoritesCountButton } from './FavoritesCountButton';

import styles from './HomePage.module.css';

export const HomePage = () => {
  const {
    data,
    status,
    loadingScope,
    errorMessage,
    selection,
    search,
    query,
    inputRef,
    retry,
    clearSearch,
    count,
    onQueryChange,
    clearQuery,
    selectGenre,
    selectPage,
    goToFavorites,
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
          value={query}
          inputRef={inputRef}
          onChange={onQueryChange}
          onClear={clearQuery}
        />

        <FavoritesCountButton count={count} onClick={goToFavorites} />
      </section>

      <ShowSearchResults
        data={data}
        status={status}
        loadingScope={loadingScope}
        errorMessage={errorMessage}
        queryEcho={search}
        selection={selection}
        onGenreSelect={selectGenre}
        onPageSelect={selectPage}
        onRetry={retry}
        onClear={clearSearch}
      />
    </>
  );
};
