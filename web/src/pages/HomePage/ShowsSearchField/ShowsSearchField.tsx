import type { ChangeEvent, RefObject } from 'react';
import { Search, X } from 'lucide-react';

import styles from './ShowsSearchField.module.css';

type ShowsSearchFieldProps = {
  value: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
};

export const ShowsSearchField = ({
  value,
  inputRef,
  onChange,
  onClear,
}: ShowsSearchFieldProps) => (
  <div className={styles.searchBar} role="search">
    <Search className={styles.searchIcon} size={20} aria-hidden="true" />

    <input
      ref={inputRef}
      className={styles.query}
      type="text"
      value={value}
      onChange={onChange}
      placeholder="Search for TV shows..."
      aria-label="Search for TV shows"
      autoComplete="off"
      autoFocus
    />

    {value && (
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
