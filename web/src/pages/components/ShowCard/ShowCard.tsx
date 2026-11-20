import { Star } from 'lucide-react';

import type { Show } from '@api/types';

import { formatNetwork, formatRating, formatYear } from '../../utils';
import { FavoriteButton } from '../FavoriteButton';
import { ShowStatusBadge } from '../ShowStatusBadge';

import styles from './ShowCard.module.css';

type ShowCardProps = {
  show: Show;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

export const ShowCard = ({
  show,
  isFavorite,
  onToggleFavorite,
}: ShowCardProps) => (
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

      <div className={styles.posterFade} />

      <div className={styles.badges}>
        <span className={styles.statusBadge}>
          <ShowStatusBadge status={show.status} />
        </span>

        <span className={styles.badgesRight}>
          <span className={styles.ratingBadge}>
            <Star className={styles.star} size={13} aria-hidden="true" />
            {formatRating(show.rating?.average)}
          </span>

          <FavoriteButton
            showName={show.name}
            isFavorite={isFavorite}
            onToggle={onToggleFavorite}
          />
        </span>
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
