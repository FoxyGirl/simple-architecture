import type { ShowStatus } from '@api/types';

import styles from './ShowRowCard.module.css';

export const STATUS_CLASSES: Partial<Record<ShowStatus, string>> = {
  Running: styles.running,
  Ended: styles.ended,
  'In Development': styles.inDev,
  'To Be Determined': styles.tbd,
  Scheduled: styles.tbd,
};
