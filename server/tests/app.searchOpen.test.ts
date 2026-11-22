import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '@server/app';
import { cache } from '@server/cache';

const searchFixture = [
  { score: 1, show: { id: 11, name: 'Drama A', genres: ['Drama'] } },
];

describe('GET /api/search without a session', () => {
  beforeEach(() => {
    for (const key of Object.keys(cache)) delete cache[key];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify(searchFixture))),
    );
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('answers 200 with results and issues no session cookie', async () => {
    const response = await request(createApp()).get('/api/search?q=shows');

    expect(response.status).toBe(200);
    expect(response.body.shows).toEqual([
      { id: 11, name: 'Drama A', genres: ['Drama'] },
    ]);
    expect(response.headers['set-cookie']).toBeUndefined();
  });
});
