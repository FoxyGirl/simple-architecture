import clsx from 'clsx';
import { ChevronRight, Star } from 'lucide-react';

import { STATUS_CLASSES, STATUS_LABELS } from './constants.js';
import { formatNetwork, formatRating, formatYear } from './utils.js';

import styles from './ShowRowCard.module.css';

export const ShowRowCard = ({ show }) => {
  const statusLabel = STATUS_LABELS[show.status] ?? 'Unknown';
  const statusClass = STATUS_CLASSES[show.status] ?? styles.ended;

  return (
    <article className={styles.row}>
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
            <span className={clsx(styles.dot, statusClass)} />
            <span className={statusClass}>{statusLabel}</span>
          </span>
        </div>
      </div>

      <ChevronRight className={styles.chevron} size={16} aria-hidden="true" />
    </article>
  );
};
