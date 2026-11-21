import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestJson } from '~/api/request';
import { searchCalls } from '~/test/api-mock';

import {
  arrow,
  card,
  chip,
  click,
  page1,
  page2,
  renderHomePage,
  settle,
  typeQuery,
} from '../../../test/home-flow';
import {
  comedyPage,
  resetDeferredSearches,
  resolveNextSearch,
  stubDeferredSearch,
} from './helpers';

// The presenter runs over the mocked request boundary (vi.mock never hoists
// inside the shared helper, so the mock lives in this suite).
vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();

  return { ...actual, requestJson: vi.fn() };
});

const api = vi.mocked(requestJson);

// A selection load (genre or page) keeps the results frame on screen — the
// head, the chips and the pagination never unmount — and swaps only the
// cards. A different query invalidates the whole block instead.
describe('HomePage selection loading', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    api.mockReset();
    resetDeferredSearches();
    stubDeferredSearch(api);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('a genre change keeps the head, chips and pagination and swaps only the cards', async () => {
    renderHomePage(['/?search=office']);
    resolveNextSearch(page1);
    await settle();
    expect(card('Show One')).toBeInTheDocument();

    await click(chip('Comedy'));

    // The stored head, the chips (the new genre pressed immediately) and the
    // pagination stay; the stored cards are gone while the load is pending.
    expect(screen.getByText('Search Results')).toBeInTheDocument();
    expect(screen.getByText('6 shows')).toBeInTheDocument();
    expect(chip('Comedy')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Show One' }),
    ).not.toBeInTheDocument();

    resolveNextSearch(comedyPage);
    await settle();

    expect(card('Comedy Only')).toBeInTheDocument();
    expect(chip('Comedy')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('heading', { name: 'Show One' })).toBeNull();
  });

  it('a page change keeps the frame and shows the selected page immediately', async () => {
    renderHomePage(['/?search=office']);
    resolveNextSearch(page1);
    await settle();

    await click(arrow('Next page'));

    expect(screen.getByText('Search Results')).toBeInTheDocument();
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Show One' }),
    ).not.toBeInTheDocument();

    resolveNextSearch(page2);
    await settle();

    expect(card('Show Four')).toBeInTheDocument();
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
  });

  it('a new search replaces the whole results block with skeletons', async () => {
    renderHomePage(['/?search=office']);
    resolveNextSearch(page1);
    await settle();

    // The draft announces a different query: no stored frame survives it.
    typeQuery('friends');
    expect(screen.queryByText('Search Results')).toBeNull();

    await settle();
    expect(screen.queryByText('Search Results')).toBeNull();

    resolveNextSearch(page2);
    await settle();

    expect(screen.getByText('Search Results')).toBeInTheDocument();
    expect(card('Show Four')).toBeInTheDocument();
    expect(searchCalls(api)).toHaveLength(2);
  });
});
