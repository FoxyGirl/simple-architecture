import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { searchShowsPage } from '@api/shows';

import { HomePage } from '../index';

import {
  arrow,
  card,
  chip,
  click,
  page1,
  page2,
  settle,
  typeQuery,
} from '../../../test/home-flow';

vi.mock('@api/shows', () => ({ searchShowsPage: vi.fn() }));

describe('HomePage envelope-driven rendering', () => {
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
