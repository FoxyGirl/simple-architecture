import styles from './ShowRowCard.module.css';

export const STATUS_LABELS = {
  Running: 'Running',
  Ended: 'Ended',
  'In Development': 'In Development',
  'To Be Determined': 'To Be Determined',
  Scheduled: 'Scheduled',
};

export const STATUS_CLASSES = {
  Running: styles.running,
  Ended: styles.ended,
  'In Development': styles.inDev,
  'To Be Determined': styles.tbd,
  Scheduled: styles.tbd,
};
