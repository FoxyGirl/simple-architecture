import { describe, expect, it } from 'vitest';

import { readFromHome } from '../location-state';

describe('readFromHome', () => {
  it('reads the Home URL out of the navigation state', () => {
    expect(readFromHome({ fromHome: '/?search=ban&page=2' })).toBe(
      '/?search=ban&page=2',
    );
  });

  it('answers null for a missing or malformed state', () => {
    const invalid: unknown[] = [
      null,
      undefined,
      'fromHome',
      42,
      {},
      { fromHome: 42 },
    ];

    for (const state of invalid) {
      expect(readFromHome(state)).toBeNull();
    }
  });
});
