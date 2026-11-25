import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestJson } from '~/api/request';
import {
  lastSearchCall,
  searchCalls,
  searchSelection,
  stubApi,
} from '~/test/api-mock';

import {
  card,
  chip,
  click,
  currentLocation,
  page1,
  page2,
  renderHomePage,
  settle,
} from '../../../test/home-flow';

vi.mock('~/api/request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/api/request')>();

  return { ...actual, requestJson: vi.fn() };
});

const api = vi.mocked(requestJson);

const requestOfLast = () => searchSelection(lastSearchCall(api));

const input = () =>
  screen.getByRole('textbox', { name: 'Search for TV shows' });

describe('HomePage URL-driven requests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    api.mockReset();
    stubApi(api, { search: () => page1 });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('requests and renders exactly the state the URL describes', async () => {
    stubApi(api, { search: () => page2 });
    renderHomePage(['/?search=office&genre=Comedy&page=2']);
    await settle();

    expect(requestOfLast()).toEqual({ genre: 'Comedy', page: 2 });
    expect(input()).toHaveValue('office');
    expect(chip('Comedy')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/for “office”/)).toBeInTheDocument();
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(card('Show Four')).toBeInTheDocument();
    expect(currentLocation()).toBe('/?search=office&genre=Comedy&page=2');
  });

  it('defaults a non-numeric page to 1 without rewriting the URL', async () => {
    renderHomePage(['/?search=office&page=abc']);
    await settle();

    expect(requestOfLast()).toEqual({ genre: undefined, page: 1 });
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(currentLocation()).toBe('/?search=office&page=abc');
  });

  it('resets an unknown genre after the fetch replaces it with the default', async () => {
    const empty = { ...page1, shows: [], totalCount: 0, pageCount: 1 };
    stubApi(api, {
      search: (call) =>
        searchSelection(call).genre === 'Horror' ? empty : page1,
    });

    renderHomePage(['/?search=office&genre=Horror']);
    await settle();
    await settle();

    expect(searchSelection(searchCalls(api)[0])).toEqual({
      genre: 'Horror',
      page: 1,
    });
    expect(requestOfLast()).toEqual({ genre: undefined, page: 1 });
    expect(currentLocation()).toBe('/?search=office');
    expect(chip('All genres')).toHaveAttribute('aria-pressed', 'true');
    expect(card('Show One')).toBeInTheDocument();
  });

  it('a genre click writes the URL and requests its first page', async () => {
    renderHomePage(['/?search=office']);
    await settle();
    stubApi(api, { search: () => page2 });

    await click(chip('Comedy'));

    expect(currentLocation()).toBe('/?search=office&genre=Comedy');
    expect(requestOfLast()).toEqual({ genre: 'Comedy', page: 1 });
  });
});
