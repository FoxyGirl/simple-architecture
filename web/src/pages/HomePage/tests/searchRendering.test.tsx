import { act, cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { searchShowsPage } from '~/api/shows';
import { replaceSearchResult, store } from '~/store';

import {
  arrow,
  card,
  chip,
  click,
  page1,
  page2,
  renderHomePage,
  settle,
  storedPage,
  typeQuery,
} from '../../../test/home-flow';

vi.mock('~/api/shows', () => ({ searchShowsPage: vi.fn() }));

describe('HomePage envelope-driven rendering', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(searchShowsPage).mockReset().mockResolvedValue(page1);
    renderHomePage();
    typeQuery('office');
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('renders cards, chips, counts and arrows from the envelope', async () => {
    await settle();

    expect(card('Show One')).toBeInTheDocument();
    expect(chip('All genres')).toHaveAttribute('aria-pressed', 'true');
    expect(chip('Comedy')).toBeInTheDocument();
    expect(screen.getByText('6 shows')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(arrow('Previous page')).toBeDisabled();
    expect(arrow('Next page')).toBeEnabled();
  });

  it('renders the shows the Entity store holds', async () => {
    await settle();

    // The successful search stored its envelope in the Entity — and that is
    // what is on screen: replacing the store content re-renders the list
    // without any new request.
    expect(storedPage()).toEqual(page1);

    act(() => {
      store.dispatch(replaceSearchResult(page2));
    });

    expect(card('Show Four')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Show One' }),
    ).not.toBeInTheDocument();
    expect(searchShowsPage).toHaveBeenCalledTimes(1);
  });

  it('a failed selection shows the error panel and retry re-runs the request', async () => {
    await settle();
    vi.mocked(searchShowsPage)
      .mockRejectedValueOnce(new Error('TVmaze search failed with status 502'))
      .mockResolvedValue(page2);

    await click(arrow('Next page'));

    expect(card('Something went wrong.')).toBeInTheDocument();

    await click(arrow('Retry request'));

    const calls = vi.mocked(searchShowsPage).mock.calls;
    expect(calls[calls.length - 2]?.[1]).toEqual({ genre: undefined, page: 2 });
    expect(calls[calls.length - 1]?.[1]).toEqual({ genre: undefined, page: 2 });
    expect(card('Show Four')).toBeInTheDocument();
  });
});
