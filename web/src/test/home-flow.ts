import { act, fireEvent, screen } from '@testing-library/react';
import { vi } from 'vitest';

import type { SearchPage, Show } from '@api/types';

// Shared helpers for the HomePage server-driven search-flow test suites.

// Mirrors DEBOUNCE_MS in the search-field presenter.
const DEBOUNCE_MS = 800;

const show = (id: number, name: string, genres = ['Drama']): Show =>
  ({ id, name, genres }) as Show;

const envelope = (over: Partial<SearchPage> = {}): SearchPage => ({
  shows: [],
  page: 1,
  pageCount: 1,
  totalCount: 0,
  genres: [],
  ...over,
});

// Six shows over two pages; the genre list comes from the backend.
export const page1 = envelope({
  shows: [show(1, 'Show One'), show(2, 'Show Two'), show(3, 'Show Three')],
  totalCount: 6,
  pageCount: 2,
  genres: ['Comedy', 'Drama'],
});

export const page2 = envelope({
  shows: [show(4, 'Show Four'), show(5, 'Show Five'), show(6, 'Show Six')],
  page: 2,
  totalCount: 6,
  pageCount: 2,
  genres: ['Comedy', 'Drama'],
});

const input = () =>
  screen.getByRole('textbox', { name: 'Search for TV shows' });

export const chip = (name: string) => screen.getByRole('button', { name });

export const arrow = (name: string) => screen.getByRole('button', { name });

export const card = (name: string) => screen.getByRole('heading', { name });

export const typeQuery = (value: string) => {
  fireEvent.change(input(), { target: { value } });
};

// Runs the debounce and flushes the resolved request promises.
export const settle = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
  });
};

const flush = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
};

export const click = async (element: HTMLElement) => {
  fireEvent.click(element);
  await flush();
};
