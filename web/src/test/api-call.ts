/**
 * One call the Task made through `requestJson`, parsed back into the parts
 * the suites assert on. The request layer itself is covered by its own
 * suite, so Task and component suites stub it at this boundary.
 */
export type ApiCall = {
  path: string;
  method: string;
  params: URLSearchParams;
  body: unknown;
  signal: AbortSignal | undefined;
};

// The Task calls the mocked `requestJson` before the real layer serializes
// the body, so a body is either the raw value or an already encoded string.
const decodeBody = (body: unknown): unknown => {
  if (typeof body !== 'string') return body;
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
};

export const toCall = (url: string, init: unknown): ApiCall => {
  const target = new URL(url, 'http://api.test');
  const options =
    init instanceof AbortSignal
      ? { signal: init }
      : (init as
          | { method?: string; body?: unknown; signal?: AbortSignal }
          | undefined);

  return {
    path: target.pathname,
    method: options?.method ?? 'GET',
    params: target.searchParams,
    body: decodeBody(options?.body),
    signal: options?.signal,
  };
};
