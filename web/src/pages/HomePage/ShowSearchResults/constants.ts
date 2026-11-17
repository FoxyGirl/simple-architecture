import type { ShowStatus } from '@api/types';

export const RESULTS_PER_PAGE = 3;

export const ALL_GENRES = 'All genres';

export const STATUS_LABELS: Partial<Record<ShowStatus, string>> = {
  Running: 'Running',
  Ended: 'Ended',
  'In Development': 'In Development',
  'To Be Determined': 'To Be Determined',
  Scheduled: 'Scheduled',
};
