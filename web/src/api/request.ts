import { getApiBaseUrl } from './config';
import { ApiError } from './errors';

import type { QueryParam } from './types';

const encodeParams = (params: QueryParam[]): string =>
  params
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&');

/**
 * Builds the full URL of an API endpoint: the configured base URL, the path
 * and the percent-encoded query parameters. With the default base URL the
 * result stays the same-origin relative URL (`/api/search?...`).
 */
export const buildApiUrl = (
  path: string,
  params: QueryParam[] = [],
): string => {
  const query = encodeParams(params);

  return `${getApiBaseUrl()}${path}${query ? `?${query}` : ''}`;
};

/**
 * Requests `url` and parses the JSON body of the response. A non-OK response
 * becomes a normalized {@link ApiError}; an aborted request keeps throwing
 * its `AbortError` so superseded runs stay recognisable to the caller.
 */
export const requestJson = async <T>(
  url: string,
  signal?: AbortSignal,
): Promise<T> => {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new ApiError(
      `API request failed with status ${response.status}`,
      response.status,
    );
  }

  return (await response.json()) as T;
};
