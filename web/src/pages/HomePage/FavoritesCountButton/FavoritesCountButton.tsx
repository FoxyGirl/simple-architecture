import { Heart } from 'lucide-react';

import styles from './FavoritesCountButton.module.css';

type FavoritesCountButtonProps = {
  count: number;
  onClick: () => void;
};

export const FavoritesCountButton = ({
  count,
  onClick,
}: FavoritesCountButtonProps) => (
  <button
    type="button"
    className={styles.button}
    aria-label={`View favorites (${count})`}
    onClick={onClick}
  >
    <Heart
      className={styles.icon}
      size={15}
      aria-hidden="true"
      fill="currentColor"
    />
    <span className={styles.count}>{count}</span>
    <span className={styles.label}>favorites</span>
  </button>
);
