import { Search, X } from 'lucide-react';

import type { SearchChange, SearchControls } from '../types';

import { useShowsSearchField } from './logic/useShowsSearchField';

import styles from './ShowsSearchField.module.css';

type ShowsSearchFieldProps = {
  onSearchChange: (change: SearchChange) => void;
  registerControls: (controls: SearchControls | null) => void;
  submitSearch: (query: string) => void;
  isCurrentQuery: (query: string) => boolean;
  abortSearch: () => void;
};

export const ShowsSearchField = (props: ShowsSearchFieldProps) => {
  const { query, handleSearch, clearQuery, inputRef } =
    useShowsSearchField(props);

  return (
    <div className={styles.searchBar} role="search">
      <Search className={styles.searchIcon} size={20} aria-hidden="true" />

      <input
        ref={inputRef}
        className={styles.query}
        type="text"
        value={query}
        onChange={handleSearch}
        placeholder="Search for TV shows..."
        aria-label="Search for TV shows"
        autoComplete="off"
        autoFocus
      />

      {query && (
        <button
          className={styles.clearButton}
          type="button"
          onClick={clearQuery}
          aria-label="Clear search"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
