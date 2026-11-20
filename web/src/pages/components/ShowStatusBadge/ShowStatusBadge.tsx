import clsx from 'clsx';

import type { ShowStatus } from '@api/types';

import { STATUS_CLASSES, STATUS_LABELS } from './constants';

import styles from './ShowStatusBadge.module.css';

type ShowStatusBadgeProps = {
  status: ShowStatus;
};

export const ShowStatusBadge = ({ status }: ShowStatusBadgeProps) => {
  const statusClass = STATUS_CLASSES[status] ?? styles.tbd;

  return (
    <span className={styles.badge}>
      <span className={clsx(styles.dot, statusClass)} />
      <span className={statusClass}>{STATUS_LABELS[status] ?? 'Unknown'}</span>
    </span>
  );
};
