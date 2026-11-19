import type { Show } from '@api/types';

import { FavoriteButton } from '../../components/FavoriteButton';
import { formatNetwork, formatYear } from '../../utils';

import styles from './FavoriteShowCard.module.css';

type FavoriteShowCardProps = {
  show: Show;
  onRemove: () => void;
};

export const FavoriteShowCard = ({ show, onRemove }: FavoriteShowCardProps) => (
  <article className={styles.card}>
    <div className={styles.poster}>
      {show.image ? (
        <img
          className={styles.posterImage}
          src={show.image.medium}
          alt=""
          loading="lazy"
        />
      ) : (
        <div className={styles.posterFallback} />
      )}

      <div className={styles.buttonSlot}>
        <FavoriteButton showName={show.name} isFavorite onToggle={onRemove} />
      </div>
    </div>

    <div className={styles.info}>
      <h3 className={styles.title}>{show.name}</h3>

      <div className={styles.meta}>
        <span className={styles.year}>{formatYear(show)}</span>
        <span className={styles.separator} />
        <span className={styles.network}>{formatNetwork(show)}</span>
      </div>

      <p className={styles.genres}>{show.genres.join(' · ')}</p>
    </div>
  </article>
);
