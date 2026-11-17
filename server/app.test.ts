import request from 'supertest';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from 'vitest';

import { createApp } from './app';

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const usOffice = { id: 1, name: 'The Office (US)', genres: ['Comedy'] };
const ukOffice = { id: 2, name: 'The Office (UK)', genres: ['Comedy'] };
const officeResults = [
  { score: 1, show: usOffice },
  { score: 0.9, show: ukOffice },
];

describe('server app', () => {
  it('responds with Express 404 for an unknown route', async () => {
    const response = await request(createApp()).get('/anything');

    expect(response.status).toBe(404);
  });

  describe('GET /api/shows', () => {
    let mockedFetch: Mock;

    beforeEach(() => {
      mockedFetch = vi.fn();
      vi.stubGlobal('fetch', mockedFetch);
      vi.spyOn(console, 'log').mockImplementation(() => undefined);
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it('returns 200 with the mapped shows for a valid query', async () => {
      mockedFetch.mockResolvedValue(jsonResponse(officeResults));

      const response = await request(createApp()).get('/api/shows?q=office');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([usOffice, ukOffice]);
    });

    it('returns 400 with an error JSON when q is missing', async () => {
      const response = await request(createApp()).get('/api/shows');

      expect(response.status).toBe(400);
      expect(typeof response.body.error).toBe('string');
      expect(mockedFetch).not.toHaveBeenCalled();
    });

    it('returns 400 with an error JSON when q is empty', async () => {
      const response = await request(createApp()).get('/api/shows?q=');

      expect(response.status).toBe(400);
      expect(typeof response.body.error).toBe('string');
      expect(mockedFetch).not.toHaveBeenCalled();
    });

    it('returns 502 with an error JSON when the upstream fails', async () => {
      mockedFetch.mockRejectedValue(new TypeError('fetch failed'));

      const response = await request(createApp()).get('/api/shows?q=office');

      expect(response.status).toBe(502);
      expect(response.body.error).toContain('TVmaze request failed');
    });

    it('stays responsive after an upstream failure', async () => {
      const app = createApp();
      mockedFetch.mockRejectedValue(new TypeError('fetch failed'));
      expect((await request(app).get('/api/shows?q=office')).status).toBe(502);

      mockedFetch.mockResolvedValue(jsonResponse(officeResults));
      const retry = await request(app).get('/api/shows?q=office');

      expect(retry.status).toBe(200);
      expect(retry.body).toEqual([usOffice, ukOffice]);
    });
  });
});
