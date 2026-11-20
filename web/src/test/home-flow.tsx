import { act, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import { replaceSearchResult, store } from '~/store';

import type { SearchPage, Show } from '~/types';

import { HomePage } from '../pages/HomePage';
import { LocationProbe } from './location-probe';

// Shared helpers for the HomePage server-driven search-flow test suites.
// NOTE: favorites mocking lives in the suites themselves — vi.mock does
// not hoist inside this helper, so a registration here would run only
// after the HomePage import chain already resolved the real API module.

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

// What the backend returns for the "Comedy" genre of the same query.
export const comedyPage = envelope({
  shows: [show(10, 'Comedy Only')],
  totalCount: 1,
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

// Renders HomePage against the application store the Tasks dispatch into, so
// the suites can both drive and inspect the shows Entity. The reset empties
// the Entity — every suite starts from the documented fresh-start state. The
// presenter navigates through the Router, so the page renders inside a
// MemoryRouter (the count suite adds route stubs of its own).
export const renderHomePage = (entries: string[] = ['/']) => {
  store.dispatch(replaceSearchResult(envelope()));

  return remountHomePage(entries);
};

// A navigation within the running app: the Entity survives the remount.
export const remountHomePage = (entries: string[] = ['/']) =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={entries}>
        <LocationProbe />
        <HomePage />
      </MemoryRouter>
    </Provider>,
  );

// The Entity's current content, straight from the store the Presenter reads.
export const storedPage = () => store.getState().shows;

// The router state rendered by the LocationProbe.
export const currentLocation = () =>
  screen.getByTestId('location').textContent ?? '';

export const navigationType = () =>
  screen.getByTestId('navigation-type').textContent ?? '';
