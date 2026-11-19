import { describe, expect, it } from 'vitest';

import type { Show } from '~/types';
import {
  RESULTS_PER_PAGE,
  clampPage,
  getPageCount,
  getPageShows,
} from '../pagination';

const show = (id: number): Show =>
  ({ id, name: `Show ${id}`, genres: [] as string[] }) as Show;

const shows = [1, 2, 3, 4, 5, 6, 7].map((id) => show(id));

describe('pagination helpers', () => {
  it('computes pageCount as max(1, ceil(totalCount / RESULTS_PER_PAGE))', () => {
    expect(RESULTS_PER_PAGE).toBe(3);
    expect(getPageCount(0)).toBe(1);
    expect(getPageCount(3)).toBe(1);
    expect(getPageCount(4)).toBe(2);
    expect(getPageCount(7)).toBe(3);
  });

  it('slices RESULTS_PER_PAGE shows per page', () => {
    expect(getPageShows(shows, 1)).toEqual([shows[0], shows[1], shows[2]]);
    expect(getPageShows(shows, 2)).toEqual([shows[3], shows[4], shows[5]]);
    expect(getPageShows(shows, 3)).toEqual([shows[6]]);
  });

  it('clamps the requested page into [1, pageCount]', () => {
    expect(clampPage(0, 3)).toBe(1);
    expect(clampPage(2, 3)).toBe(2);
    expect(clampPage(-5, 1)).toBe(1);
    expect(clampPage(999, 3)).toBe(3);
  });
});
