import clsx from 'clsx';
import { Heart } from 'lucide-react';

import styles from './FavoriteButton.module.css';

type FavoriteButtonProps = {
  showName: string;
  isFavorite: boolean;
  onToggle: () => void;
};

export const FavoriteButton = ({
  showName,
  isFavorite,
  onToggle,
}: FavoriteButtonProps) => (
  <button
    type="button"
    className={clsx(styles.button, { [styles.active]: isFavorite })}
    aria-pressed={isFavorite}
    aria-label={`${isFavorite ? 'Remove' : 'Add'} ${showName} ${
      isFavorite ? 'from' : 'to'
    } favorites`}
    onClick={onToggle}
  >
    <Heart
      className={styles.icon}
      size={16}
      aria-hidden="true"
      fill={isFavorite ? 'currentColor' : 'none'}
    />
  </button>
);
