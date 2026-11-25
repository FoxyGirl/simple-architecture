import { describe, expect, it } from 'vitest';

import type { Show } from '@server/types';
import {
  ALL_GENRES,
  buildSearchPage,
  collectGenres,
  filterShowsByGenre,
} from '../shows';

const show = (id: number, genres: string[]): Show =>
  ({ id, name: `Show ${id}`, genres }) as Show;

const shows = [
  show(1, ['Drama', 'Crime']),
  show(2, ['Comedy']),
  show(3, ['Drama']),
  show(4, ['Comedy', 'Romance']),
  show(5, ['Drama', 'Fantasy']),
  show(6, ['Comedy']),
  show(7, ['Drama']),
];

const ALL_PRESENT = ['Comedy', 'Crime', 'Drama', 'Fantasy', 'Romance'];

describe('collectGenres', () => {
  it('returns the sorted, deduplicated genres present in the result set', () => {
    expect(collectGenres(shows)).toEqual(ALL_PRESENT);
    expect(collectGenres([])).toEqual([]);
  });
});

describe('filterShowsByGenre', () => {
  it('keeps only the shows carrying the requested genre', () => {
    expect(filterShowsByGenre(shows, 'Drama')).toEqual([
      shows[0],
      shows[2],
      shows[4],
      shows[6],
    ]);
  });

  it('returns everything when no genre or All genres is selected', () => {
    expect(filterShowsByGenre(shows, undefined)).toBe(shows);
    expect(filterShowsByGenre(shows, ALL_GENRES)).toBe(shows);
  });
});

describe('buildSearchPage', () => {
  it('returns the envelope for the unfiltered first page', () => {
    expect(buildSearchPage(shows, undefined, 1)).toEqual({
      shows: [shows[0], shows[1], shows[2]],
      page: 1,
      pageCount: 3,
      totalCount: 7,
      genres: ALL_PRESENT,
    });
  });

  it('filters by genre while reporting the unfiltered genres', () => {
    const page = buildSearchPage(shows, 'Drama', 1);

    expect(page.shows).toEqual([shows[0], shows[2], shows[4]]);
    expect(page.totalCount).toBe(4);
    expect(page.pageCount).toBe(2);
    expect(page.genres).toEqual(ALL_PRESENT);
  });

  it('clamps out-of-range pages into [1, pageCount]', () => {
    expect(buildSearchPage(shows, undefined, 0)).toMatchObject({
      page: 1,
      shows: [shows[0], shows[1], shows[2]],
    });
    expect(buildSearchPage(shows, undefined, 999)).toMatchObject({
      page: 3,
      shows: [shows[6]],
    });
  });

  it('returns an empty first page for an empty result set', () => {
    expect(buildSearchPage([], 'Drama', 3)).toEqual({
      shows: [],
      page: 1,
      pageCount: 1,
      totalCount: 0,
      genres: [],
    });
  });
});
