/**
 * A normalized API-layer failure: the server responded, but not OK. Carries
 * the HTTP `status` so error handling can branch on it. Aborted requests and
 * network-level errors are deliberately not wrapped — they propagate
 * unchanged so callers keep recognising a superseded request by its
 * `AbortError` name.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
