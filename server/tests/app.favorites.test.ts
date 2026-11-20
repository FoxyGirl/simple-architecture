import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '@server/app';
import { favorite } from '@server/routes/favorites';
import type { Show } from '@server/types';

const show = (id: number): Show =>
  ({ id, name: `Show ${id}`, genres: ['Drama'] }) as Show;

const add = (id: number) =>
  request(createApp())
    .post('/api/favorites')
    .send({ show: show(id) });

describe('favorites API', () => {
  let mockedFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset the exported storage seam (as `cache`); the mocked fetch lets
    // the suites prove favorites never reach TVmaze.
    for (const key of Object.keys(favorite)) delete favorite[Number(key)];
    mockedFetch = vi.fn();
    vi.stubGlobal('fetch', mockedFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('POST /api/favorites adds the show and returns the updated summary', async () => {
    const first = await add(11);

    expect(first.status).toBe(200);
    expect(first.body).toEqual({ count: 1, ids: [11] });

    const second = await add(12);

    expect(second.body).toEqual({ count: 2, ids: [11, 12] });
  });

  it('POST /api/favorites returns 400 with an error JSON without a valid show', async () => {
    const empty = await request(createApp()).post('/api/favorites').send({});

    expect(empty.status).toBe(400);
    expect(typeof empty.body.error).toBe('string');

    const invalid = await request(createApp())
      .post('/api/favorites')
      .send({ show: { name: 'No id' } });

    expect(invalid.status).toBe(400);
    expect(invalid.body).toEqual({ error: expect.any(String) });
  });

  it('GET /api/favorites/count reflects the adds and the removes', async () => {
    await add(11);
    await add(12);
    await request(createApp()).delete('/api/favorites/11');

    const response = await request(createApp()).get('/api/favorites/count');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ count: 1, ids: [12] });
  });

  it('GET /api/favorites serves the second slice with correct metadata', async () => {
    for (const id of [11, 12, 13, 14]) await add(id);

    const response = await request(createApp()).get('/api/favorites?page=2');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      shows: [show(14)],
      page: 2,
      pageCount: 2,
      totalCount: 4,
    });
  });

  it('DELETE /api/favorites/:id removes the show and returns the summary', async () => {
    await add(11);
    await add(12);

    const removed = await request(createApp()).delete('/api/favorites/11');

    expect(removed.status).toBe(200);
    expect(removed.body).toEqual({ count: 1, ids: [12] });
  });

  it('DELETE with an unknown id is a no-op, a non-numeric id is a 400', async () => {
    await add(11);

    const unknown = await request(createApp()).delete('/api/favorites/999');

    expect(unknown.status).toBe(200);
    expect(unknown.body).toEqual({ count: 1, ids: [11] });

    const invalid = await request(createApp()).delete('/api/favorites/abc');

    expect(invalid.status).toBe(400);
    expect(invalid.body).toEqual({ error: expect.any(String) });
  });

  it('serves favorites without any upstream TVmaze call', async () => {
    await add(11);
    await request(createApp()).get('/api/favorites/count');
    await request(createApp()).get('/api/favorites?page=1');
    await request(createApp()).delete('/api/favorites/11');

    expect(mockedFetch).not.toHaveBeenCalled();
  });
});
