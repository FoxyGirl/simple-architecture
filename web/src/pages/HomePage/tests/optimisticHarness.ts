import { screen } from '@testing-library/react';

import type { FavoritesSummary } from '~/types';

import { renderHomePage, settle, typeQuery } from '../../../test/home-flow';

// Shared parts of the HomePage optimistic-toggle suites: the locators the
// optimistic-window assertions read, the empty backend mirror every suite
// starts from, and the gate that keeps a write response in flight until the
// test opens it. The `~/api/request` and `~/notification` mocks are declared
// in the suites themselves — vi.mock does not hoist inside shared helpers.

export const emptySummary: FavoritesSummary = { count: 0, ids: [] };

export const favoriteButton = (name: string) =>
  screen.getByRole('button', { name });

export const countButton = (count: number) =>
  screen.getByRole('button', { name: `View favorites (${count})` });

export const deferredSummary = () => {
  let resolve!: (summary: FavoritesSummary) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<FavoritesSummary>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

export type SummaryGate = ReturnType<typeof deferredSummary>;

// Renders the page, searches and settles the debounce — the cards appear
// with the summaries the mocks resolve with at that moment.
export const searchAsGuest = async () => {
  renderHomePage();
  typeQuery('office');
  await settle();
};
