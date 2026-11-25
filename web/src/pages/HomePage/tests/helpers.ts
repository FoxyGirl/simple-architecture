import { screen } from '@testing-library/react';
import { expect } from 'vitest';
import type { Mock } from 'vitest';

import type { SearchPage, Show } from '~/types';

import { stubApi } from '../../../test/api-mock';
import { card, chip } from '../../../test/home-flow';

// Fixtures and the deferred-search harness of the in-flight restoration
// suites: responses resolve only when the suite says so, and reject like a
// real fetch when their signal aborts.

export const RESTORATION_URL = '/?search=office&genre=Drama&page=2';

const show = (id: number, name: string): Show =>
  ({ id, name, genres: ['Drama'] }) as Show;

export const dramaPage2: SearchPage = {
  shows: [show(13, 'Drama Four')],
  page: 2,
  pageCount: 2,
  totalCount: 4,
  genres: ['Comedy', 'Drama'],
};

export const comedyPage: SearchPage = {
  shows: [show(10, 'Comedy Only')],
  page: 1,
  pageCount: 1,
  totalCount: 1,
  genres: ['Comedy', 'Drama'],
};

type PendingSearch = {
  settle: (page: SearchPage) => void;
  done: boolean;
};

const pendingSearches: PendingSearch[] = [];

export const resetDeferredSearches = (): void => {
  pendingSearches.length = 0;
};

export const stubDeferredSearch = (mock: Mock): void => {
  stubApi(mock, {
    search: (call) =>
      new Promise<SearchPage>((resolve, reject) => {
        const pending: PendingSearch = { done: false, settle: () => {} };
        pending.settle = (page) => {
          if (pending.done) return;
          pending.done = true;
          resolve(page);
        };
        pendingSearches.push(pending);
        call.signal?.addEventListener('abort', () => {
          if (pending.done) return;
          pending.done = true;
          reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
        });
      }),
    favoritesCount: () => ({ count: 0, ids: [] }),
  });
};

export const resolveNextSearch = (page: SearchPage): void => {
  const pending = pendingSearches.find((entry) => !entry.done);
  if (!pending) throw new Error('No pending search to resolve.');
  pending.settle(page);
};

// The applied page of `RESTORATION_URL`, filters and pagination included.
export const expectRestoredView = (): void => {
  expect(
    screen.getByRole('textbox', { name: 'Search for TV shows' }),
  ).toHaveValue('office');
  expect(chip('Drama')).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
  expect(card('Drama Four')).toBeInTheDocument();
};
