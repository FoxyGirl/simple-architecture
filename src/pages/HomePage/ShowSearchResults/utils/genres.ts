import type { Show } from '@api/types';

import { ALL_GENRES } from '../constants';

const collectPresentGenres = (shows: Show[]) => {
  const present = new Set<string>();

  shows.forEach((show) => {
    show.genres?.forEach((genre) => present.add(genre));
  });

  return [...present].sort();
};

/**
 * Build the list of filter chips for a result set: the "All genres" option
 * followed by every genre the shows actually carry, alphabetically.
 */
export const collectGenres = (shows: Show[]): string[] => [
  ALL_GENRES,
  ...collectPresentGenres(shows),
];

/**
 * Keep only the shows that belong to the given genre.
 */
export const filterShowsByGenre = (shows: Show[], genre: string): Show[] => {
  if (genre === ALL_GENRES) return shows;

  return shows.filter((show) => show.genres?.includes(genre));
};
