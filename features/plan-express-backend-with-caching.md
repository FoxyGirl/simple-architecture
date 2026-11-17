# Plan: Express Backend with Caching

**PRD:** features/prd-express-backend-with-caching.md

**Date:** 2026-11-17

> **Revision 2 (2026-11-17):** the project is split into two folders — `web/`
> (frontend) and `server/` (backend) — as npm workspaces, per explicit user
> request. The PRD itself only requires the backend to run as a separate
> process; the two-folder split is a structural decision on top of it.
>
> **Revision 3 (2026-11-17):** automated testing instruments (Vitest for both
> workspaces, supertest for the backend, Playwright for E2E) and the
> `TVMAZE_BASE_URL` test seam added per explicit user request. The PRD was
> amended accordingly — testing instruments moved from out of scope into
> scope.
>
> Target layout:
>
> ```
> simple-architecture/
> ├── web/                 # frontend workspace: src/, index.html,
> │   │                    # vite.config.ts, vitest.config.ts,
> │   │                    # tsconfig*.json, scripts/, vercel.json
> │   └ package.json       #
> ├── server/              # backend workspace: app.js, index.js,
> │   │                    # tvmaze.js, cache.js, shows.js, vitest.config.js
> │   └ package.json       # express dependency
> ├── e2e/                 # Playwright specs + TVmaze stub (stub/tvmaze.js)
> ├── playwright.config.js # E2E harness (root)
> ├── package.json         # workspace root: "workspaces": ["web", "server"],
> │                        # shared tooling + forwarding scripts
> ├── eslint.config.js     # shared root flat config (covers web/, server/,
> │                        # e2e/ and playwright.config.js)
> ├── .prettierrc.json / .prettierignore / .husky/   # shared, unchanged
> └── docs/ features/ design/                        # unchanged, at root
> ```
>
> Tooling decisions (verified against the current configs):
>
> - Shared tooling stays at the root: one ESLint flat config (its JS block
>   already lints `**/*.js` with Node globals for `server/` and `e2e/`, its
>   TS block covers `web/`), Prettier, husky and lint-staged.
>   `.husky/pre-commit` (`npx lint-staged`) and the lint-staged globs match
>   files at any depth and need no changes. Test scripts stay out of the
>   pre-commit hook.
> - `.gitignore` / `.prettierignore` patterns (`dist`, `node_modules`,
>   `*.tsbuildinfo`, `.vite`) are unanchored and keep matching inside `web/`.
> - `scripts/generate-css-types.mjs` resolves paths from `import.meta.dirname`
>   and the tsconfig references are relative, so both move into `web/`
>   unmodified.
> - Root forwarding scripts keep the documented commands stable:
>   `npm run dev` -> web, `npm run server` -> server,
>   `npm run test` -> both workspaces, `npm run test:e2e` -> Playwright.
>
> Testing approach: every phase writes its automated tests **before**
> implementing it (red -> green), so the "E2E before implementation" rule is
> directly feasible. Vitest runs unit/integration tests in both workspaces
> (`web/`: jsdom + @testing-library/react for presenters and components;
> `server/`: supertest drives the exported Express app without binding a
> port, `vi.spyOn` mocks `globalThis.fetch`). Playwright boots the stub, the
> backend and the frontend as `webServer` entries and drives a real browser.
> The E2E TVmaze stub (fixtures, per-query hit counter, fail-next control)
> plus the backend's `TVMAZE_BASE_URL` env seam (default unchanged) make
> cache and error behavior deterministic and independent of the external
> API. Manual checks remain only where automation cannot reach (visual
> comparison, real-TVmaze spot checks, network-tab inspection).
>
> The backend is plain JavaScript ESM (`server/package.json` declares
> `"type": "module"`; Node 24 provides global `fetch` — no new tooling). It
> listens on port 3001 by default (`PORT` env override); the Vite dev server
> proxies `/api` to it, so no CORS setup is needed in dev. The E2E stub
> listens on port 3002.

## Implementation Phases

### Phase 1: Split the repo into `web/` and `server/` workspaces

**Goal:** The two-folder structure exists and works: the frontend moves
into `web/` unchanged in behavior, `server/` is scaffolded as a runnable
Express workspace, and all shared tooling keeps working from the root.
Tracer bullet for the two-process, two-folder architecture.

**Affects:** frontend, backend

**Tasks:**

- [ ] Turn the root `package.json` into the workspace root:
      `"workspaces": ["web", "server"]`, keep `"type": "module"` (the root
      `eslint.config.js` and `playwright.config.js` are ESM), keep the shared
      tooling devDependencies (eslint, @eslint/js, typescript-eslint, eslint
      plugins, eslint-config-prettier, globals, prettier, husky, lint-staged),
      keep root-level `lint`/`lint:fix`/`format`/`format:check`/`prepare` and
      the lint-staged config, and forward `dev`/`build`/`preview`/`typecheck`/
      `css-types` to `-w web` and `server` to `-w server`.
- [ ] Create `web/package.json` (app name/scripts `dev`, `prebuild`, `build`,
      `preview`, `pretypecheck`, `typecheck`, `css-types`) with the app
      dependencies (react, react-dom, react-router-dom, clsx, lucide-react)
      and frontend devDependencies (vite, @vitejs/plugin-react, typescript,
      @types/react, @types/react-dom, @types/node).
- [ ] Move the frontend into `web/`: `src/`, `index.html`, `vite.config.ts`,
      the three `tsconfig*.json` files, `scripts/` and `vercel.json` (note:
      production deployment is out of scope per the PRD, but the Vercel Root
      Directory setting must point at `web/` whenever the app is deployed
      again); delete stale root artifacts (`dist/`, `*.tsbuildinfo`).
- [ ] Create `server/package.json` (`"type": "module"`, `express` dependency,
      `"server": "node index.js"` script) and `server/index.js`: an Express
      app listening on `PORT` (default 3001), no routes yet.
- [ ] Update the root `eslint.config.js` alias resolver to
      `web/src/api` and `web/src/hooks` (incl. the "keep in sync with
      vite.config.ts" comment); confirm `globalIgnores(['dist', 'coverage'])`
      still matches `web/dist` (unanchored pattern — no edit expected).
- [ ] Run a fresh `npm install` (single root lockfile resolving both
      workspaces) and update the structure/path references in AGENTS.md and
      README (commands stay valid through the root forwarding scripts).

**Tests:**

- [ ] `npm install` succeeds with one root lockfile; `node_modules` only
      exists at the root (hoisted workspaces).
- [ ] `npm run dev` serves the app at `http://localhost:5173` and searching
      behaves exactly as before the split (the frontend still calls TVmaze
      directly at this point).
- [ ] `npm run build`, `npm run typecheck`, `npm run css-types`,
      `npm run lint` and `npm run format:check` all pass from the root.
- [ ] `npm run server` starts Express; `curl http://localhost:3001/anything`
      returns Express's 404 response (server is up, no routes yet).
- [ ] CSS Module type declarations regenerate at their new location
      (`web/src/**/*.module.css.d.ts`) with no stale files left behind.
- [ ] `git status` shows the moves as renames and no gitignored artifact
      (`web/dist`, tsbuildinfo) becomes tracked.

**When ready:**

The repository is a two-workspace monorepo: `web/` builds, typechecks and
runs identically to the pre-split app, `server/` starts as an independent
Express process via `npm run server`, and every root command and git hook
works unchanged.

**Acceptance Criteria:**

- [ ] The project is split into `web/` (frontend) and `server/` (backend)
      folders, each with its own `package.json`, managed as npm workspaces.
- [ ] The frontend builds and behaves exactly as before the split; all
      existing root scripts and the pre-commit hook still work.
- [ ] The backend workspace starts as a separate Express process.

### Phase 2: Testing instruments for web and server

**Goal:** Both workspaces have runnable Vitest suites, the backend is
structured for supertest, and a root Playwright harness with a local TVmaze
stub exists — so every later phase can write failing tests first.

**Affects:** frontend, backend

**Tasks:**

- [ ] Add `web/` testing devDependencies (vitest, jsdom,
      @testing-library/react, @testing-library/user-event), create
      `web/vitest.config.ts` (jsdom environment, reuses
      @vitejs/plugin-react, same `@api`/`@hooks` aliases as vite.config.ts)
      and the `"test": "vitest run"` script; write one smoke test (HomePage
      renders the search input).
- [ ] Add `server/` testing devDependencies (vitest, supertest), create
      `server/vitest.config.js` (node environment) and the
      `"test": "vitest run"` script; restructure `server/` for testability:
      export the Express app from `server/app.js` and keep `server/index.js`
      as the listen-on-`PORT` entry; supertest smoke test (unknown route
      returns Express's 404).
- [ ] Add `@playwright/test` at the root, install the chromium browser, and
      create `playwright.config.js` with three `webServer` entries: the stub
      (`node e2e/stub/tvmaze.js`, port 3002), the backend (`npm run server`,
      env `TVMAZE_BASE_URL=http://localhost:3002`) and the frontend
      (`npm run dev`, port 5173); `testDir: 'e2e'`, baseURL
      `http://localhost:5173`.
- [ ] Create the E2E TVmaze stub `e2e/stub/tvmaze.js`: a plain Node HTTP
      server serving `search/shows?q=` from fixture data, counting upstream
      hits per query and exposing the counter via `GET /__hits`; write one
      Playwright smoke spec (app loads, search input visible).
- [ ] Add the root scripts `"test": "npm run test --workspaces --if-present"`
      and `"test:e2e": "playwright test"`; document `npm run test` and
      `npm run test:e2e` in AGENTS.md and README; confirm lint and format
      pass on all new config/spec/stub files.

**Tests:**

- [ ] `npm run test` passes from the root: both workspace smoke tests are
      green.
- [ ] `npm run test:e2e` passes: Playwright boots stub + backend + frontend,
      and the smoke spec sees the app with its search input.
- [ ] The stub counter works: `curl http://localhost:3002/__hits` before and
      after a `search/shows?q=` call shows the per-query count incrementing
      (the basis for all later cache assertions).
- [ ] `npm run lint` and `npm run format:check` pass with the new files.

**When ready:**

`npm run test` and `npm run test:e2e` are part of the repo's commands, all
three harnesses (web unit, server integration, E2E with the counting TVmaze
stub) run green at smoke level, and subsequent phases can practice
test-first development.

**Acceptance Criteria:**

- [ ] Vitest suites exist and pass in both workspaces (`npm run test`).
- [ ] A Playwright E2E harness exists and passes (`npm run test:e2e`),
      booting the backend, the frontend and a local TVmaze stub with a
      per-query hit counter.
- [ ] The backend exports its Express app separately from listening, so
      supertest can drive it without binding a port.
- [ ] The test commands are documented in AGENTS.md/README.

### Phase 3: TVmaze search proxy endpoint

**Goal:** The backend owns the TVmaze interaction:
`GET /api/shows?q=<query>` fetches `search/shows?q=` (via the
`TVMAZE_BASE_URL` seam, default `https://api.tvmaze.com`), maps
`{ score, show }[]` to `Show[]` and returns it as JSON.

**Affects:** backend

**Tasks:**

- [ ] Write this phase's tests first (see Tests) — they must fail before the
      implementation exists.
- [ ] Create `server/tvmaze.js`: build requests from
      `process.env.TVMAZE_BASE_URL ?? 'https://api.tvmaze.com'` (test seam,
      default behavior unchanged); fetch `search/shows?q=` (URL-encoded),
      map the response to `show` objects, throw on a non-OK or failed
      request; log every outgoing TVmaze request to the console with a
      timestamp (the observability basis for the cache criteria in Phase 5).
- [ ] Add `GET /api/shows?q=` to `server/app.js`: 400 with an error JSON
      when `q` is missing or empty; 200 with the show array; 502 with an
      error JSON when the TVmaze request fails.
- [ ] Keep files within the repo's 120-line `max-lines` lint budget by
      splitting routing from the TVmaze module as needed; confirm lint,
      format and the full suite pass.

**Tests:**

- [ ] `server/tvmaze.test.js` (mocked `globalThis.fetch`): maps
      `{ score, show }[]` to show objects; URL-encodes the query; uses
      `TVMAZE_BASE_URL` when set and the real API base by default; throws on
      non-OK and network failures; logs one request line per call.
- [ ] supertest against the exported app: `GET /api/shows?q=office` returns
      200 with the fixture show array; missing and empty `q` return 400 with
      an error JSON; a failing upstream returns 502 with an error JSON and
      the app stays responsive.
- [ ] The full Phase 2 suite still passes.
- [ ] Manual (real-API spot check): `npm run server` without the env seam +
      `curl ".../api/shows?q=office"` returns real TVmaze data.

**When ready:**

`GET /api/shows?q=` returns the same show list the browser currently gets
from TVmaze, invalid input or TVmaze failure produces a proper error
response, the behavior is covered by automated tests that never touch the
external API, and the frontend is untouched — the app still works exactly as
before.

**Acceptance Criteria:**

- [ ] An Express.js backend server exists in `server/` and runs as a separate
      process from the Vite dev server.
- [ ] The backend returns TVmaze search results as JSON and responds with
      error statuses (400/502) on bad input or TVmaze failure — verified by
      automated tests with a mocked upstream.
- [ ] The `TVMAZE_BASE_URL` seam defaults to `https://api.tvmaze.com`, so
      real-API behavior is unchanged.

### Phase 4: Frontend fetches from the backend instead of TVmaze

**Goal:** The browser stops calling `api.tvmaze.com`; all show data flows
through the backend. UX is unchanged (filtering and pagination stay
client-side for now).

**Affects:** frontend

**Tasks:**

- [ ] Write this phase's tests first (see Tests) — they must fail before the
      implementation exists.
- [ ] Add a dev-server proxy in `web/vite.config.ts`: `/api` ->
      `http://localhost:3001`.
- [ ] Rename `web/src/api/tvmaze.ts` to `web/src/api/shows.ts` and change
      `searchShows` to fetch `/api/shows?q=` (same signature, same
      `AbortSignal` support, same non-OK handling); update the import in
      `useShowsDataFetching.ts`.
- [ ] Extend the E2E stub with a fail-next control (`POST /__fail-next`
      arms the next `search/shows` call to return 500) so the error-panel
      and retry flow becomes deterministic in E2E.
- [ ] Document how to run the two processes (`npm run server` + `npm run dev`)
      in the README or AGENTS.md commands section.

**Tests:**

- [ ] Web unit tests: `searchShows` calls `/api/shows?q=` with the encoded
      query, returns the shows, throws on non-OK responses and propagates
      the `AbortSignal` (mocked fetch); presenter-hook tests with fake
      timers: the debounce fires a single request and a query change aborts
      the in-flight one.
- [ ] `e2e/search.spec.js`: typing a query renders the fixture result cards;
      the stub counter shows exactly 1 upstream hit; a route interceptor
      records zero browser requests to `api.tvmaze.com`.
- [ ] E2E error flow: with fail-next armed, a search shows the existing
      error panel; clicking "Retry request" renders the results (fail-next
      consumed, backend stays up).
- [ ] `npm run typecheck`, `npm run lint`, `npm run test` and
      `npm run test:e2e` all pass.
- [ ] Manual: browser network-tab spot check (only `/api/shows` requests for
      show data); with the backend stopped, the error panel appears and
      retry succeeds after restarting it.

**When ready:**

The app is fully functional through the backend: every search goes
browser -> Vite proxy -> Express -> TVmaze (or the stub in E2E), no browser
request touches `api.tvmaze.com`, and loading/error/retry behavior is
unchanged and covered by automated tests.

**Acceptance Criteria:**

- [ ] Using the app produces no browser network requests to `api.tvmaze.com`;
      all show data comes from the backend — asserted by the E2E route
      interceptor.
- [ ] When TVmaze fails (or the backend is down), the backend path reports an
      error and the UI shows its existing error state with a working retry —
      covered in E2E via the stub's fail-next control.
- [ ] Existing UI behavior is preserved: loading and error states work, and
      the search flow (debounce, abort, reset on new search) is unchanged —
      covered by web unit tests.

### Phase 5: TVmaze response cache (plain object, 5-minute TTL)

**Goal:** Repeated identical TVmaze requests within 5 minutes are served from
an in-memory plain-object cache, reducing requests to the external API — the
primary goal of the feature. Transparent to the frontend.

**Affects:** backend

**Tasks:**

- [ ] Write this phase's tests first (see Tests) — they must fail before the
      implementation exists.
- [ ] Create `server/cache.js` with `const cache = {}` keyed by the TVmaze
      request URL (including the encoded query), storing
      `{ data, fetchedAt }` per entry; define the TTL constant
      `5 * 60 * 1000`.
- [ ] Implement the cached fetch: if an entry exists and is younger than
      5 minutes, return its data without calling TVmaze; if the cache is
      empty or the entry is outdated, fetch TVmaze and store/overwrite the
      entry. Failed TVmaze requests must not create or refresh cache entries.
- [ ] Route the Phase 3 endpoint's TVmaze access through the cached fetch and
      log `HIT`/`MISS` (with the cache key) for every request.

**Tests:**

- [ ] `server/cache.test.js` with fake timers (`vi.useFakeTimers`): the first
      call fetches and stores (MISS); an identical call within 5 minutes
      returns the cached data with the upstream fetch called exactly once
      (HIT); advancing the clock past 5 minutes makes the next call refetch
      and update the entry (the following call is a HIT again); different
      queries are cached independently; a failed fetch neither creates nor
      refreshes an entry.
- [ ] supertest: two identical `GET /api/shows?q=office` calls return
      identical JSON with the upstream fetch called once.
- [ ] E2E cache spec: searching the same query twice keeps the stub counter
      at 1; a different query raises it to 2. (The 5-minute expiry is not
      exercised in E2E — it is covered deterministically by the fake-timer
      unit tests.)
- [ ] Manual: `HIT`/`MISS` lines are visible in the server log; restarting
      the server clears the cache (first request is a MISS).

**When ready:**

The server makes at most one TVmaze request per distinct query per 5 minutes;
cache behavior is proven by automated tests without real-time waiting, is
observable via `HIT`/`MISS` logs, and the app behaves identically from the
user's perspective.

**Acceptance Criteria:**

- [ ] TVmaze responses are stored in a plain object cache (`const cache = {}`)
      keyed by the TVmaze request.
- [ ] Repeating an identical search within 5 minutes returns the cached data
      and makes no new request to TVmaze (automated tests + server logs).
- [ ] Repeating an identical search more than 5 minutes after the cached
      request makes a new TVmaze request and updates the cache entry —
      proven by fake-timer tests without real-time waiting.
- [ ] Different search queries are cached independently of each other.

### Phase 6: Backend genre filtering and pagination endpoint

**Goal:** A new endpoint `GET /api/search?q=&genre=&page=` that filters by
genre and paginates on the backend, returning the page slice plus the
metadata the UI needs (total matching count, genres present in the unfiltered
result set). The Phase 3 endpoint stays untouched so the app keeps working.

**Affects:** backend

**Tasks:**

- [ ] Write this phase's tests first (see Tests) — they must fail before the
      implementation exists.
- [ ] Create `server/shows.js` with the result-processing helpers and the
      shared constants `RESULTS_PER_PAGE = 3` and `ALL_GENRES = 'All genres'`
      (mirroring the current frontend constants).
- [ ] Implement genre collection: the sorted, deduplicated list of genres
      present in the unfiltered result set (the frontend keeps prepending its
      own `ALL_GENRES` chip).
- [ ] Implement genre filtering: when the `genre` parameter is present (and
      is not `All genres`), keep only shows whose `genres` include it; when
      absent, return unfiltered results.
- [ ] Implement pagination on the filtered list: `totalCount` = filtered
      length, `pageCount = max(1, ceil(totalCount / 3))`, requested page
      clamped to `[1, pageCount]`, `shows` = the 3-item slice of that page.
- [ ] Add `GET /api/search?q=&genre=&page=` to `server/app.js` returning
      `{ shows, page, pageCount, totalCount, genres }` as JSON; 400 when `q`
      is missing; data source is the cached TVmaze fetch from Phase 5 (no
      per-page/per-genre caching).

**Tests:**

- [ ] `server/shows.test.js`: genre collection is sorted and deduplicated;
      filtering keeps only matching shows for a specific genre and returns
      everything when the genre is absent or `All genres`; pagination slices
      3 per page, computes `pageCount = max(1, ceil(totalCount / 3))`,
      clamps pages to `[1, pageCount]`; an empty result yields
      `{ shows: [], totalCount: 0, pageCount: 1 }`.
- [ ] supertest matrix against `/api/search`: the envelope
      `{ shows, page, pageCount, totalCount, genres }` is returned; `page=1`
      returns at most 3 shows and `page=2` a different slice;
      `genre=Drama` returns only Drama shows with a matching `totalCount`;
      `page=0` and `page=999` clamp to the first/last page; missing `q`
      returns 400.
- [ ] Cache reuse: varying only `genre`/`page` for the same `q` keeps the
      upstream fetch at exactly one call.
- [ ] The full previous suite passes — `/api/shows` and the running app
      behave exactly as in Phase 5.

**When ready:**

`GET /api/search` fully implements server-side filtering and pagination with
the metadata envelope, is proven by automated tests against the same
behaviors the frontend currently computes client-side, and the existing app
is unaffected.

**Acceptance Criteria:**

- [ ] A backend request with a query, a genre, and a page returns only the
      shows of that page, with 3 shows per page (matching the current UI).
- [ ] When a specific genre is requested, every returned show includes that
      genre; when no genre filter is applied, shows are returned unfiltered.
- [ ] The backend response includes the total matching count and the genres
      present in the unfiltered result set.
- [ ] Genre/page changes reuse the cache — no extra TVmaze requests for the
      same query within 5 minutes.

### Phase 7: Server-driven filtering and pagination in the frontend

**Goal:** Selection changes (genre, page) become backend requests; the UI
renders chips, counts and pagination from the response envelope; all
client-side filtering/pagination code and the legacy endpoint are removed.

**Affects:** frontend, backend

**Tasks:**

- [ ] Write this phase's tests first (see Tests) — they must fail before the
      implementation exists.
- [ ] Add the envelope type to `web/src/api/types.ts` and a `searchShowsPage`
      function in `web/src/api/shows.ts` calling `/api/search?q=&genre=&page=`
      (genre omitted for `All genres`), with `AbortSignal` support.
- [ ] Lift the fetch coordination into the common ancestor presenter
      (`useHomePage`, delegating to the existing data-fetching hook per
      docs/architecture.md): the snapshot now holds the envelope instead of
      the full `Show[]`; submitting a search requests `q` with page 1 and no
      genre; retry re-runs the current `q`/genre/page request.
- [ ] Make selection changes server-driven: a genre change requests page 1
      with that genre, a page change requests that page — reusing the
      existing loading/error status machinery and aborting the in-flight
      request when a newer one starts.
- [ ] Update `GenreFilter` (chips = `ALL_GENRES` + envelope `genres`),
      `ResultsHead` (`totalCount` from the envelope) and `Pagination`
      (`page`/`pageCount` from the envelope) to render from the envelope.
- [ ] Remove the dead client-side code: `filterShowsByGenre`, `collectGenres`,
      `getPageShows`, `getPageCount`, `clampPage`, the data-bound
      `Selection`/`SelectionChange` shapes and `resolveSelection`; simplify
      the selection to `{ genre, page }` and update the `utils` barrel.
- [ ] Remove the legacy `/api/shows` route from the backend (with its
      frontend counterpart `searchShows`) and the Phase 4 supertest/unit
      tests that cover them; sync the docs with the final architecture: the
      API row of the AGENTS.md stack table (Express backend in `server/`
      proxying TVmaze with caching) and any data-flow descriptions in
      `docs/`.

**Tests:**

- [ ] Web tests (Testing Library): submitting a search requests `q` with
      page 1 and no genre; a genre change requests page 1 with that genre; a
      page change requests that page; chips render as `ALL_GENRES` + the
      envelope `genres`; the count label and pagination arrows render from
      `totalCount`/`pageCount` and disable at the edges; a new search resets
      genre and page; a selection-change failure shows the error panel and
      retry re-runs the current `q`/genre/page; an in-flight request is
      aborted when a newer one starts.
- [ ] `e2e/browse.spec.js`: search renders fixture cards and chips ->
      selecting a genre renders only matching cards and resets the page to 1
      -> `All genres` restores the full list -> paginating changes the slice
      and disables arrows at the edges — with the stub counter staying at 1
      upstream hit through all genre/page changes and rising to 2 only for a
      new query.
- [ ] The full suite passes: `npm run test` (both workspaces),
      `npm run test:e2e`, `npm run typecheck`, `npm run lint` and
      `npm run build`; compiler/ESLint report no unused utils or types.
- [ ] Manual: visual comparison — chips list, "N shows found" count and
      pagination controls look exactly as before the migration.

**When ready:**

The frontend is fully server-driven: the browser only ever calls
`/api/search`, filtering/pagination code no longer exists in `web/`, the
legacy endpoint is gone from `server/`, the complete automated suite
(unit + integration + E2E) is green, and the UI is visually and behaviorally
identical to the pre-migration app.

**Acceptance Criteria:**

- [ ] The backend response metadata drives the UI: genre filter chips and
      pagination controls render unchanged from the envelope.
- [ ] Existing UI behavior is preserved: loading and error states work, a new
      search resets the genre filter and page, and changing the genre resets
      the page to 1 — covered by web tests and E2E.
- [ ] No client-side genre filtering or pagination code remains, and the
      legacy `/api/shows` endpoint is removed.
- [ ] Repeated selection changes for the same query are served from the
      backend cache without new TVmaze requests — asserted via the stub hit
      counter in E2E.
- [ ] `npm run test` passes for both workspaces and `npm run test:e2e`
      passes the full Playwright suite.
