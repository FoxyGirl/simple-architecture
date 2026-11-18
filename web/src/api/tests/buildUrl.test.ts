import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildApiUrl } from '../request';

describe('api buildApiUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('keeps the URL same-origin relative with the default base', () => {
    expect(buildApiUrl('/api/search', [['q', 'the office']])).toBe(
      '/api/search?q=the%20office',
    );
  });

  it('percent-encodes every query parameter in order', () => {
    expect(
      buildApiUrl('/api/search', [
        ['q', 'shows'],
        ['genre', 'Kids & Family'],
        ['page', 2],
      ]),
    ).toBe('/api/search?q=shows&genre=Kids%20%26%20Family&page=2');
  });

  it('omits the query string when there are no parameters', () => {
    expect(buildApiUrl('/api/search')).toBe('/api/search');
  });

  it('prefixes the configured base URL', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://backend.example.test');

    expect(buildApiUrl('/api/search', [['q', 'office']])).toBe(
      'https://backend.example.test/api/search?q=office',
    );
  });
});
