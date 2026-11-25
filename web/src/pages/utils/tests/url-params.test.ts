import { describe, expect, it } from 'vitest';

import { parsePageParam } from '../url-params';

describe('parsePageParam', () => {
  it('keeps a valid page number', () => {
    expect(parsePageParam('3')).toBe(3);
  });

  it('defaults a missing value to page 1', () => {
    expect(parsePageParam(null)).toBe(1);
  });

  it('defaults non-numeric, empty, fractional and sub-1 values to 1', () => {
    for (const value of ['abc', '', '2.5', '0', '-4']) {
      expect(parsePageParam(value)).toBe(1);
    }
  });
});
