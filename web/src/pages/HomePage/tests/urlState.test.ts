import { describe, expect, it } from 'vitest';

import {
  hasSearchParams,
  isSameRequest,
  parseSearchState,
  serializeSearchState,
  toSelection,
} from '../logic/urlState';

const params = (query: string) => new URLSearchParams(query);

describe('parseSearchState', () => {
  it('reads the applied search, genre and page', () => {
    expect(parseSearchState(params('search=world&genre=Drama&page=2'))).toEqual(
      { search: 'world', genre: 'Drama', page: 2 },
    );
  });

  it('falls back to the defaults for a bare URL', () => {
    expect(parseSearchState(params(''))).toEqual({
      search: '',
      genre: 'All genres',
      page: 1,
    });
  });

  it('trims the search and defaults invalid values', () => {
    expect(parseSearchState(params('search=+office+&page=abc'))).toEqual({
      search: 'office',
      genre: 'All genres',
      page: 1,
    });
  });
});

describe('serializeSearchState', () => {
  it('omits parameters equal to their defaults', () => {
    expect(
      serializeSearchState({
        search: '',
        genre: 'All genres',
        page: 1,
      }).toString(),
    ).toBe('');
  });

  it('writes non-default values in a stable order', () => {
    expect(
      serializeSearchState({
        search: 'world',
        genre: 'Drama',
        page: 2,
      }).toString(),
    ).toBe('search=world&genre=Drama&page=2');
  });

  it('round-trips a state through parse and serialize', () => {
    const state = { search: 'world', genre: 'Comedy', page: 3 };
    expect(parseSearchState(serializeSearchState(state))).toEqual(state);
  });
});

describe('url state helpers', () => {
  it('detects whether any synchronized parameter is present', () => {
    expect(hasSearchParams(params(''))).toBe(false);
    expect(hasSearchParams(params('search='))).toBe(true);
    expect(hasSearchParams(params('page=2'))).toBe(true);
  });

  it('maps a state onto a selection and compares requests', () => {
    expect(toSelection({ search: 'a', genre: 'Drama', page: 2 })).toEqual({
      genre: 'Drama',
      page: 2,
    });

    const request = { query: 'a', genre: 'Drama', page: 2 };
    expect(isSameRequest(request, { ...request })).toBe(true);
    expect(isSameRequest(request, { ...request, page: 3 })).toBe(false);
    expect(isSameRequest(null, request)).toBe(false);
  });
});
