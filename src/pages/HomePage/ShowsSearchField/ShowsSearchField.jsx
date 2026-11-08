import { Search, X } from 'lucide-react';

import styles from './ShowsSearchField.module.css';

export const ShowsSearchField = ({ query, onChange, onClear }) => (
  <div className={styles.searchBar} role="search">
    <Search className={styles.searchIcon} size={20} aria-hidden="true" />

    <input
      className={styles.query}
      type="text"
      value={query}
      onChange={onChange}
      placeholder="Search for TV shows..."
      aria-label="Search for TV shows"
      autoComplete="off"
    />

    {query && (
      <button
        className={styles.clearButton}
        type="button"
        onClick={onClear}
        aria-label="Clear search"
      >
        <X size={16} aria-hidden="true" />
      </button>
    )}
  </div>
);
