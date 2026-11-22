import clsx from 'clsx';
import { ChevronRight, Star } from 'lucide-react';

import type { Show } from '~/types';

import { formatNetwork, formatRating, formatYear } from '../../utils';
import { FavoriteButton } from '../FavoriteButton';
import { ShowStatusBadge } from '../ShowStatusBadge';

import styles from './ShowRowCard.module.css';

type ShowRowCardProps = {
  show: Show;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isRemoved?: boolean;
  isPending?: boolean;
  canFavorite?: boolean;
};

export const ShowRowCard = ({
  show,
  isFavorite,
  onToggleFavorite,
  isRemoved = false,
  isPending = false,
  canFavorite = true,
}: ShowRowCardProps) => (
  <article className={clsx(styles.row, { [styles.removed]: isRemoved })}>
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
    </div>

    <div className={styles.info}>
      <h3 className={styles.title}>{show.name}</h3>

      <p className={styles.meta}>
        {formatYear(show)} · {formatNetwork(show)}
      </p>

      <p className={styles.genres}>{show.genres.join(' · ')}</p>

      <div className={styles.ratingRow}>
        <span className={styles.rating}>
          <Star className={styles.star} size={11} aria-hidden="true" />
          {formatRating(show.rating?.average)}
        </span>

        <span className={styles.status}>
          <ShowStatusBadge status={show.status} />
        </span>
      </div>
    </div>

    {canFavorite && (
      <FavoriteButton
        showName={show.name}
        isFavorite={isFavorite}
        onToggle={onToggleFavorite}
        isPending={isPending}
      />
    )}

    <ChevronRight className={styles.chevron} size={16} aria-hidden="true" />
  </article>
);
