/**
 * The base URL that prefixes every API request. The default is empty, which
 * keeps the request URLs same-origin relative (`/api/...`) — exactly what
 * the Vite dev proxy and the Playwright E2E harness rely on. Set the
 * `VITE_API_URL` environment variable to point the app at a different
 * backend server; no caller code changes are needed.
 */
export const getApiBaseUrl = (): string => import.meta.env.VITE_API_URL ?? '';
