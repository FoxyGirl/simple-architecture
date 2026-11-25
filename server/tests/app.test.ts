import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '@server/app';

describe('server app', () => {
  it('responds with Express 404 for an unknown route', async () => {
    const response = await request(createApp()).get('/anything');

    expect(response.status).toBe(404);
  });

  it('serves no legacy /api/shows endpoint', async () => {
    const response = await request(createApp()).get('/api/shows?q=office');

    expect(response.status).toBe(404);
  });
});
