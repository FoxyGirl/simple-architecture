import { act, cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestJson } from '~/api/request';
import { replaceSearchResult, store } from '~/store';
import { searchCalls, searchSelection, stubApi } from '~/test/api-mock';

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

vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();

  return { ...actual, requestJson: vi.fn() };
});

const api = vi.mocked(requestJson);

describe('HomePage envelope-driven rendering', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    api.mockReset();
    stubApi(api, { search: () => page1 });
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
    expect(searchCalls(api)).toHaveLength(1);
  });

  it('a failed selection shows the error panel and retry re-runs the request', async () => {
    await settle();
    stubApi(api, {
      search: () => {
        throw new Error('TVmaze search failed with status 502');
      },
    });

    await click(arrow('Next page'));

    expect(card('Something went wrong.')).toBeInTheDocument();
    expect(
      screen.getByText('TVmaze search failed with status 502'),
    ).toBeInTheDocument();

    stubApi(api, { search: () => page2 });

    await click(arrow('Retry request'));

    const calls = searchCalls(api);
    expect(searchSelection(calls[calls.length - 2])).toEqual({
      genre: undefined,
      page: 2,
    });
    expect(searchSelection(calls[calls.length - 1])).toEqual({
      genre: undefined,
      page: 2,
    });
    expect(card('Show Four')).toBeInTheDocument();
  });
});
