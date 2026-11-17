import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { searchShowsPage } from '@api/shows';

import { HomePage } from './index';

import {
  arrow,
  chip,
  click,
  page1,
  page2,
  settle,
  typeQuery,
} from '../../test/home-flow';

vi.mock('@api/shows', () => ({ searchShowsPage: vi.fn() }));

const selectionOfLast = () => {
  const calls = vi.mocked(searchShowsPage).mock.calls;
  return calls[calls.length - 1]?.[1];
};

describe('HomePage server-driven request flow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(searchShowsPage).mockReset().mockResolvedValue(page1);
    render(<HomePage />);
    typeQuery('office');
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('submitting a search requests page 1 with no genre', async () => {
    await settle();

    expect(searchShowsPage).toHaveBeenCalledWith(
      'office',
      { genre: undefined, page: 1 },
      { signal: expect.any(AbortSignal) },
    );
  });

  it('a genre change requests page 1 with that genre', async () => {
    await settle();
    await click(chip('Comedy'));

    expect(selectionOfLast()).toEqual({ genre: 'Comedy', page: 1 });
  });

  it('a page change requests that page', async () => {
    await settle();
    vi.mocked(searchShowsPage).mockResolvedValue(page2);

    await click(arrow('Next page'));

    expect(selectionOfLast()).toEqual({ genre: undefined, page: 2 });
  });

  it('a new search resets genre and page', async () => {
    await settle();
    await click(chip('Comedy'));

    typeQuery('friends');
    await settle();

    expect(searchShowsPage).toHaveBeenLastCalledWith(
      'friends',
      { genre: undefined, page: 1 },
      expect.anything(),
    );
    expect(chip('All genres')).toHaveAttribute('aria-pressed', 'true');
  });

  it('aborts the in-flight request when a newer one starts', async () => {
    const signals: AbortSignal[] = [];
    vi.mocked(searchShowsPage).mockImplementation((_query, _sel, options) => {
      if (options?.signal) signals.push(options.signal);
      // Pending forever, like a real in-flight fetch.
      return new Promise(() => undefined);
    });

    await settle();
    expect(signals).toHaveLength(1);
    expect(signals[0]?.aborted).toBe(false);

    typeQuery('friends');
    await settle();

    expect(signals).toHaveLength(2);
    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);
  });
});
