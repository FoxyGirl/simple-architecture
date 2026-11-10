import { Search, X } from 'lucide-react';

import { usePresenterSearch } from './usePresenterSearch.js';

import styles from './ShowsSearchField.module.css';

export const ShowsSearchField = ({ onSearchChange, registerControls }) => {
  const { query, handleSearch, clearQuery, inputRef } = usePresenterSearch({
    onSearchChange,
    registerControls,
  });

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
