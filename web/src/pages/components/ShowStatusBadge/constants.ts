import type { ShowStatus } from '~/types';

import styles from './ShowStatusBadge.module.css';

export const STATUS_LABELS: Partial<Record<ShowStatus, string>> = {
  Running: 'Running',
  Ended: 'Ended',
  'In Development': 'In Development',
  'To Be Determined': 'To Be Determined',
  Scheduled: 'Scheduled',
};

export const STATUS_CLASSES: Partial<Record<ShowStatus, string>> = {
  Running: styles.running,
  Ended: styles.ended,
  'In Development': styles.inDev,
  'To Be Determined': styles.tbd,
  Scheduled: styles.tbd,
};
