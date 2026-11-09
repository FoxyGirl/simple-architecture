import clsx from 'clsx';
import { Star } from 'lucide-react';

import styles from './ShowCard.module.css';

const STATUS_LABELS = {
  Running: 'Running',
  Ended: 'Ended',
  'In Development': 'In Development',
  'To Be Determined': 'To Be Determined',
  Scheduled: 'Scheduled',
};

const STATUS_CLASSES = {
  Running: styles.running,
  Ended: styles.ended,
  'In Development': styles.inDev,
  'To Be Determined': styles.tbd,
  Scheduled: styles.tbd,
};

const formatRating = (average) =>
  average === null || average === undefined ? 'NR' : average.toFixed(1);

const formatYear = (show) => {
  const date = show.premiered ?? show.ended;
  return date ? date.slice(0, 4) : '—';
};

const formatNetwork = (show) =>
  show.network?.name ?? show.webChannel?.name ?? '—';

export const ShowCard = ({ show }) => {
  const statusLabel = STATUS_LABELS[show.status] ?? 'Unknown';
  const statusClass = STATUS_CLASSES[show.status] ?? styles.ended;

  return (
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
            <span className={clsx(styles.dot, statusClass)} />
            <span className={statusClass}>{statusLabel}</span>
          </span>

          <span className={styles.ratingBadge}>
            <Star className={styles.star} size={13} aria-hidden="true" />
            {formatRating(show.rating?.average)}
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
};
