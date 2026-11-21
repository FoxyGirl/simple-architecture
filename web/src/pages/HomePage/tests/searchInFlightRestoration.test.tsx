import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestJson } from '~/api/request';
import { searchCalls } from '~/test/api-mock';

import {
  card,
  chip,
  click,
  renderHomePage,
  settle,
  typeQuery,
} from '../../../test/home-flow';
import {
  comedyPage,
  dramaPage2,
  expectRestoredView,
  resetDeferredSearches,
  resolveNextSearch,
  RESTORATION_URL,
  stubDeferredSearch,
} from './helpers';

// The presenter runs over the mocked request boundary (vi.mock never hoists
// inside the shared helper, so the mock lives in this suite).
vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();

  return { ...actual, requestJson: vi.fn() };
});

const api = vi.mocked(requestJson);

// A draft that returns to the applied search while a fetch is still in
// flight: the restoration must wait for that fetch instead of aborting it
// or claiming success over a store it never filled.
describe('HomePage restoration while a fetch is in flight', () => {
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

  it('a draft returning during the initial fetch restores once it settles', async () => {
    renderHomePage([RESTORATION_URL]);

    // The provisional loading state shows skeletons while the mount fetch
    // is still in flight.
    typeQuery('officex');
    typeQuery('office');
    resolveNextSearch(dramaPage2);
    await settle();

    expectRestoredView();
    expect(searchCalls(api)).toHaveLength(1);
  });

  it('a draft returning during a filter fetch keeps that fetch', async () => {
    renderHomePage([RESTORATION_URL]);
    resolveNextSearch(dramaPage2);
    await settle();
    expectRestoredView();

    // The genre selection starts its own fetch; typing and deleting must
    // neither abort it nor resurrect the stale page over its URL.
    await click(chip('Comedy'));
    typeQuery('officex');
    typeQuery('office');
    resolveNextSearch(comedyPage);
    await settle();

    expect(chip('Comedy')).toHaveAttribute('aria-pressed', 'true');
    expect(card('Comedy Only')).toBeInTheDocument();
    expect(searchCalls(api)).toHaveLength(2);
  });

  it('a committed detour to another query lands back on results', async () => {
    renderHomePage([RESTORATION_URL]);
    resolveNextSearch(dramaPage2);
    await settle();

    // The debounce commits the longer query, so the selection resets.
    typeQuery('officex');
    await settle();
    resolveNextSearch(comedyPage);
    await settle();
    expect(card('Comedy Only')).toBeInTheDocument();

    // Deleting the character commits the applied query again; its fetch
    // settles into the restored results.
    typeQuery('office');
    await settle();
    resolveNextSearch(dramaPage2);
    await settle();

    expect(card('Drama Four')).toBeInTheDocument();
    expect(searchCalls(api)).toHaveLength(3);
  });
});
