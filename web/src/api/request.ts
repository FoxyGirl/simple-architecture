import { getApiBaseUrl } from './config';
import { ApiError } from './errors';

import type { QueryParam, RequestJsonOptions } from './types';

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

// A defined body travels as JSON with the matching content type; an
// absent body stays a plain (GET) request with no body property at all.
const buildRequestInit = ({
  method = 'GET',
  body,
  signal,
}: RequestJsonOptions): RequestInit => {
  const init: RequestInit = { method, signal };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }

  return init;
};

/**
 * Requests `url` and parses the JSON body of the response. The second
 * argument is either the {@link RequestJsonOptions} — method, JSON body,
 * signal — or, for a plain GET, just the `AbortSignal`. A non-OK response
 * becomes a normalized {@link ApiError}; an aborted request keeps throwing
 * its `AbortError` so superseded runs stay recognisable to the caller.
 */
export const requestJson = async <T>(
  url: string,
  init: RequestJsonOptions | AbortSignal = {},
): Promise<T> => {
  const options = init instanceof AbortSignal ? { signal: init } : init;

  const response = await fetch(url, buildRequestInit(options));

  if (!response.ok) {
    throw new ApiError(
      `API request failed with status ${response.status}`,
      response.status,
    );
  }

  return (await response.json()) as T;
};
