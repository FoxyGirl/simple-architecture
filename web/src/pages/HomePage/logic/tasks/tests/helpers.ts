import type { SearchPage, Show } from '~/types';

import type { SearchRequest } from '../../../types';

// Shared fixtures for the shows-fetch Task suite.

export const envelope = (over: Partial<SearchPage> = {}): SearchPage => ({
  shows: [],
  page: 1,
  pageCount: 1,
  totalCount: 0,
  genres: [],
  ...over,
});

export const show = (id: number): Show => ({ id, name: `Show ${id}` }) as Show;

// Data already in the Entity — must survive failed or aborted runs.
export const SENTINEL = envelope({ shows: [show(99)], totalCount: 99 });

export const PAGE_OK = envelope({
  shows: [show(1)],
  page: 2,
  pageCount: 3,
  totalCount: 5,
  genres: ['Comedy'],
});

export const PAGE_NEWER = envelope({ shows: [show(7)] });

export const REQUEST: SearchRequest = {
  query: 'office',
  genre: 'Comedy',
  page: 2,
};

export const abortError = (): Error =>
  Object.assign(new Error('The operation was aborted'), { name: 'AbortError' });

export const deferred = () => {
  let resolve!: (page: SearchPage) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<SearchPage>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};
