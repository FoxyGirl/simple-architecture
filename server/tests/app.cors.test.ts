import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '@server/app';

const login = (origin: string | undefined) => {
  const pending = request(createApp()).post('/api/auth/login');

  return (origin === undefined ? pending : pending.set('Origin', origin)).send({
    email: 'a@b.co',
  });
};

describe('CORS policy', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reflects a whitelisted Origin and allows credentials', async () => {
    vi.stubEnv('ALLOWED_ORIGINS', 'https://web.example');

    const response = await login('https://web.example');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe(
      'https://web.example',
    );
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('rejects an origin outside the whitelist with 403 before routing', async () => {
    vi.stubEnv('ALLOWED_ORIGINS', 'https://web.example');

    const response = await login('https://evil.example');

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Not allowed by CORS' });
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('trusts the local dev origin without any ALLOWED_ORIGINS configuration', async () => {
    vi.stubEnv('ALLOWED_ORIGINS', '');

    const response = await login('http://localhost:5173');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ email: 'a@b.co' });
    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:5173',
    );
  });

  it('serves requests without an Origin (server-to-server, curl)', async () => {
    vi.stubEnv('ALLOWED_ORIGINS', '');

    const response = await login(undefined);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ email: 'a@b.co' });
  });
});
