import { ChevronRight, Star } from 'lucide-react';

import styles from './ShowRowCard.module.css';

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
            <span className={`${styles.dot} ${statusClass}`} />
            {statusLabel}
          </span>
        </div>
      </div>

      <ChevronRight className={styles.chevron} size={16} aria-hidden="true" />
    </article>
  );
};
