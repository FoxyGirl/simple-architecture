/**
 * A normalized API-layer failure: the server responded, but not OK. Carries
 * the HTTP `status` so error handling can branch on it, and the server's
 * error message (the `error` field of the JSON body) as its `message`.
 * Aborted requests and network-level errors are deliberately not wrapped —
 * they propagate unchanged so callers keep recognising a superseded request
 * by its `AbortError` name.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Reads a human-readable message from any caught error. Request-layer
 * failures are `ApiError`s carrying the backend message; network failures
 * are plain `Error`s, so the Tasks report whatever message they received.
 */
export const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
