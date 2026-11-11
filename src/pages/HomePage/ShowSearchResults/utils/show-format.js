export const formatRating = (average) =>
  average === null || average === undefined ? 'NR' : average.toFixed(1);

export const formatYear = (show) => {
  const date = show.premiered ?? show.ended;
  return date ? date.slice(0, 4) : '—';
};

export const formatNetwork = (show) =>
  show.network?.name ?? show.webChannel?.name ?? '—';
