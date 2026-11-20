import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { searchShowsPage } from '@api/shows';

import {
  arrow,
  chip,
  click,
  currentLocation,
  navigationType,
  page1,
  page2,
  renderHomePage,
  settle,
  typeQuery,
} from '../../../test/home-flow';

vi.mock('@api/shows', () => ({ searchShowsPage: vi.fn() }));

const requestOfLast = () => {
  const calls = vi.mocked(searchShowsPage).mock.calls;
  return calls[calls.length - 1]?.[1];
};

const input = () =>
  screen.getByRole('textbox', { name: 'Search for TV shows' });

describe('HomePage URL writes', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(searchShowsPage).mockReset().mockResolvedValue(page1);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('typing stays local until the debounced replace write', async () => {
    renderHomePage();
    typeQuery('office');

    expect(input()).toHaveValue('office');
    expect(currentLocation()).toBe('/');

    await settle();

    expect(currentLocation()).toBe('/?search=office');
    expect(navigationType()).toBe('REPLACE');
    expect(requestOfLast()).toEqual({ genre: undefined, page: 1 });
  });

  it('genre and page changes push history; a new search resets both', async () => {
    renderHomePage();
    typeQuery('office');
    await settle();

    vi.mocked(searchShowsPage).mockResolvedValue(page1);
    await click(chip('Comedy'));
    expect(currentLocation()).toBe('/?search=office&genre=Comedy');
    expect(navigationType()).toBe('PUSH');

    vi.mocked(searchShowsPage).mockResolvedValue(page2);
    await click(arrow('Next page'));
    expect(currentLocation()).toBe('/?search=office&genre=Comedy&page=2');
    expect(navigationType()).toBe('PUSH');

    vi.mocked(searchShowsPage).mockResolvedValue(page1);
    typeQuery('friends');
    await settle();

    expect(currentLocation()).toBe('/?search=friends');
    expect(navigationType()).toBe('REPLACE');
    expect(requestOfLast()).toEqual({ genre: undefined, page: 1 });
    expect(chip('All genres')).toHaveAttribute('aria-pressed', 'true');
  });

  it('clearing idles now and drops the parameter after the debounce', async () => {
    renderHomePage(['/?search=office']);
    await settle();

    await click(screen.getByRole('button', { name: 'Clear search' }));

    expect(input()).toHaveValue('');
    expect(screen.queryByText('Search Results')).toBeNull();
    expect(currentLocation()).toBe('/?search=office');

    await settle();

    expect(currentLocation()).toBe('/');
    expect(navigationType()).toBe('REPLACE');
  });
});
