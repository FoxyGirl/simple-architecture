import { Sparkles } from 'lucide-react';

import { useHomePage } from './logic/useHomePage';

import { ShowSearchResults } from './ShowSearchResults';
import { ShowsSearchField } from './ShowsSearchField';
import { FavoritesCountButton } from './FavoritesCountButton';

import styles from './HomePage.module.css';

export const HomePage = () => {
  const {
    data,
    queryEcho,
    status,
    selection,
    retry,
    clearSearch,
    isFavorite,
    count,
    onSearchChange,
    registerControls,
    submitSearch,
    isCurrentQuery,
    abortSearch,
    selectGenre,
    selectPage,
    toggleFavorite,
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
          onSearchChange={onSearchChange}
          registerControls={registerControls}
          submitSearch={submitSearch}
          isCurrentQuery={isCurrentQuery}
          abortSearch={abortSearch}
        />

        <FavoritesCountButton count={count} onClick={goToFavorites} />
      </section>

      <ShowSearchResults
        data={data}
        status={status}
        queryEcho={queryEcho}
        selection={selection}
        isFavorite={isFavorite}
        onGenreSelect={selectGenre}
        onPageSelect={selectPage}
        onToggleFavorite={toggleFavorite}
        onRetry={retry}
        onClear={clearSearch}
      />
    </>
  );
};
