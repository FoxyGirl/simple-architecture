# PRD: Express Backend with Caching

**Date**: 2026-11-17
**Status**: Draft
**Revision**: 2026-11-17 — automated testing instruments (Vitest, supertest,
Playwright) and the `TVMAZE_BASE_URL` test seam moved into scope at user
request; the former "test infrastructure" exclusion was removed accordingly.

## Purpose

The app currently calls the TVmaze API directly from the browser and performs
genre filtering and pagination client-side, so every repeated search hits the
external API. A custom Express.js backend must own the TVmaze interaction,
genre filtering, and pagination, and cache TVmaze responses for 5 minutes to
reduce the number of requests made to the external API.

## User Scenarios

- User submits a search query -> the frontend requests results from the
  backend; the backend fetches data from TVmaze (or from cache) and returns
  the first page of unfiltered results.
- User selects a genre -> the backend returns only shows of that genre,
  starting from page 1.
- User switches to page N -> the backend returns the Nth page slice of the
  filtered result set.
- User repeats the same search within 5 minutes -> the backend returns data
  from the cache without making a request to TVmaze.
- User repeats the same search more than 5 minutes after the cached request
  -> the backend requests TVmaze again and updates the cache.
- TVmaze request fails -> the backend reports an error to the frontend and
  the UI shows its existing error state.

## In scope

- A custom backend server implemented with Express.js, running as a separate
  process from the Vite dev server.
- A backend API that accepts a search query, a genre, and a page number, and
  returns the shows for the requested page.
- Migration of the TVmaze API interaction to the backend: the backend is the
  only caller of `https://api.tvmaze.com`; the browser no longer calls it.
- Migration of genre filtering to the backend: a specific genre returns only
  matching shows; "All genres" (no genre filter) returns unfiltered results.
- Migration of pagination to the backend: the response contains only the
  shows of the requested page, with the same results-per-page as the current
  UI (3).
- The backend response provides the data the UI needs to keep rendering the
  genre filter options and pagination controls for the full result set
  (total matching count and the genres present in the unfiltered results),
  since the client no longer holds the full result set.
- An in-memory cache using a plain object (`const cache = {}`) keyed by the
  TVmaze request:
  - if the same request to TVmaze has been made within the last 5 minutes,
    return the data from the cache;
  - if the cache is empty or outdated, request TVmaze and update the cache.
- Updating the frontend to fetch show data from the backend instead of
  TVmaze, preserving the existing UI behavior (loading/error states, filter
  and page reset on a new search, page reset on genre change).
- Automated testing instruments for both parts: Vitest unit/integration
  tests for the frontend and the backend (with supertest for HTTP-level
  backend checks) and Playwright end-to-end tests exercising both processes
  together.
- A `TVMAZE_BASE_URL` environment override for the backend's TVmaze base URL
  (default `https://api.tvmaze.com`, behavior unchanged) so tests can point
  the backend at a local stub and verify cache and error behavior
  deterministically.

## Out of scope

- Persistent or external cache storage (Redis, database, file-based cache).
- Cache size limits, eviction policies (e.g. LRU), or manual cache
  invalidation beyond the 5-minute staleness rule.
- Caching at any level other than the TVmaze request (e.g. caching
  per query/genre/page combination of backend responses).
- New backend functionality beyond the migrated features (authentication,
  rate limiting, additional data sources or endpoints).
- Visual or UX changes; the existing search/filter/pagination user flow stays
  as-is.
- Production hosting and deployment of the backend.

## Technical limitations

- The frontend is a Vite 7 SPA served at `http://localhost:5173` in dev; the
  backend runs as a separate process on its own origin, so browser
  cross-origin restrictions apply (CORS or a dev-server proxy must be
  accounted for).
- Express.js is not currently a dependency of the project and must be added.
- Genre filter chips are currently derived from the full result set
  (`collectGenres`) and pagination controls from its total count; once
  pagination and filtering move to the backend, the client only receives a
  page slice, so the backend response must carry the corresponding metadata.
- The cache lives in the server process memory: it is lost on server restart
  and is not shared between multiple server instances. This is inherent to
  the required plain-object cache.
- TVmaze is an external API — its availability and response shape
  (`search/shows?q=` returning `{ score, show }[]`) are outside the project's
  control.
- The existing Vercel configuration serves the static SPA only (all routes
  rewrite to `index.html`); no server runtime is configured.
- The repository has no test runner yet; the testing instruments above
  (Vitest, supertest, Playwright) are added as part of this feature.
  Criteria that cannot be automated are verified by observation (UI
  behavior, server logs, network inspection).

## Acceptance Criteria

- [ ] An Express.js backend server exists and runs as a separate process from
      the Vite dev server.
- [ ] Using the app produces no browser network requests to `api.tvmaze.com`;
      all show data comes from the backend.
- [ ] A backend request with a query, a genre, and a page returns only the
      shows of that page, with 3 shows per page (matching the current UI).
- [ ] When a specific genre is requested, every returned show includes that
      genre; when no genre filter is applied, shows are returned unfiltered.
- [ ] The backend response includes the total matching count and the genres
      present in the unfiltered result set, and the UI renders the genre
      filter chips and pagination controls unchanged.
- [ ] TVmaze responses are stored in a plain object cache (`const cache = {}`)
      keyed by the TVmaze request.
- [ ] Repeating an identical search within 5 minutes returns the cached data
      and makes no new request to TVmaze (verifiable via server logs or
      network inspection).
- [ ] Repeating an identical search more than 5 minutes after the cached
      request makes a new TVmaze request and updates the cache entry.
- [ ] Different search queries are cached independently of each other.
- [ ] Existing UI behavior is preserved: loading and error states work, a new
      search resets the genre filter and page, and changing the genre resets
      the page to 1.
- [ ] When TVmaze fails, the backend returns an error response and the UI
      shows its existing error state.
- [ ] `npm run test` passes for both the frontend and the backend, and
      `npm run test:e2e` passes the Playwright end-to-end suite.
- [ ] Cache behavior — including the 5-minute expiry — is covered by
      automated tests that do not require real-time waiting.
