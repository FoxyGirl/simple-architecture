import type { Show } from '~/api/types';

export const formatRating = (average?: number | null): string =>
  average === null || average === undefined ? 'NR' : average.toFixed(1);

export const formatYear = (show: Show): string => {
  const date = show.premiered ?? show.ended;
  return date ? date.slice(0, 4) : '—';
};

export const formatNetwork = (show: Show): string =>
  show.network?.name ?? show.webChannel?.name ?? '—';
