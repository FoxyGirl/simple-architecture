import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestJson } from '~/api/request';
import { searchCalls, searchSelection, stubApi } from '~/test/api-mock';
import type { SearchPage, Show } from '~/types';

import {
  card,
  chip,
  remountHomePage,
  renderHomePage,
  settle,
  storedPage,
} from '../../../test/home-flow';

// The presenter runs over the mocked request boundary (vi.mock never hoists
// inside the shared helper, so the mock lives in this suite).
vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();

  return { ...actual, requestJson: vi.fn() };
});

const api = vi.mocked(requestJson);

const show = (id: number, name: string): Show =>
  ({ id, name, genres: ['Drama'] }) as Show;

const dramaPage2: SearchPage = {
  shows: [show(13, 'Drama Four')],
  page: 2,
  pageCount: 2,
  totalCount: 4,
  genres: ['Comedy', 'Drama'],
};

const URL = '/?search=office&genre=Drama&page=2';

const input = () =>
  screen.getByRole('textbox', { name: 'Search for TV shows' });

const expectRestoredView = () => {
  expect(input()).toHaveValue('office');
  expect(chip('Drama')).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
  expect(card('Drama Four')).toBeInTheDocument();
  expect(storedPage()).toEqual(dramaPage2);
};

describe('HomePage URL restoration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    api.mockReset();
    stubApi(api, {
      search: () => dramaPage2,
      favoritesCount: () => ({ count: 0, ids: [] }),
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('a fresh app start stays idle with an empty input', async () => {
    renderHomePage();
    await settle();

    expect(input()).toHaveValue('');
    expect(searchCalls(api)).toHaveLength(0);
    expect(screen.queryByText('Page 2 of 2')).toBeNull();
  });

  it('mounting a parameterized URL restores and fetches that page', async () => {
    renderHomePage([URL]);
    await settle();

    expect(searchCalls(api)).toHaveLength(1);
    expect(searchSelection(searchCalls(api)[0])).toEqual({
      genre: 'Drama',
      page: 2,
    });
    expect(searchCalls(api)[0]?.params.get('q')).toBe('office');
    expectRestoredView();
  });

  it('remounting with the same URL restores the view and fetches again', async () => {
    const view = renderHomePage([URL]);
    await settle();

    view.unmount();
    remountHomePage([URL]);
    await settle();

    expect(searchCalls(api)).toHaveLength(2);
    expectRestoredView();
  });
});
