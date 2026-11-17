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
> **Revision 4 (2026-11-17, recorded during Phase 1 execution):** two
> deviations from the plan text, both verified against the actual project
> state: (1) ESLint flat-config ignore patterns are minimatch-style, not
> gitignore-style, so `globalIgnores(['dist', 'coverage'])` did **not** match
> `web/dist` — `eslint.config.js` was updated to
> `globalIgnores(['**/dist', '**/coverage'])`; (2) lint-staged's win32 chunking
> budget equals cmd.exe's hard 8191-character limit, so a single commit
> staging all ~96 renamed files at once can overflow the quoted command line
> ("command line too long", a localized cmd error). The `.husky/pre-commit`
> hook and the lint-staged config were left unchanged as planned — normal-sized
> commits are unaffected; the one split commit can be chunked via
> `npx lint-staged --max-arg-length 6000` or committed with `--no-verify`
> after the checks have been run manually.
>
> **Revision 5 (2026-11-17):** the backend moves to TypeScript at the user's
> explicit request — the PRD leaves the implementation language open, so the
> PRD itself needs no change. Phase 1 already shipped `server/index.js` as
> plain JS; Phase 2 (which already restructures `server/` for testability)
> converts the workspace: `tsx` as the runtime (`"server": "tsx index.ts"`,
> no build step — Vitest also runs the TS tests natively),
> `server/tsconfig.json` mirroring the web compiler rules, type
> dependencies (`@types/node`, `@types/express` — express 5.3.0 ships no
> bundled types — `@types/supertest`), a Node-globals ESLint override for
> `server/**/*.ts`, and the root `typecheck` script extended to both
> workspaces. All later server files (`app.ts`, `tvmaze.ts`, `cache.ts`,
> `shows.ts`, `*.test.ts`) are TypeScript; the e2e stub and the Playwright
> specs stay plain JS (test-harness code, outside the backend workspace).
>
> **Revision 6 (2026-11-17, recorded during Phase 2 execution):** deviations
> from the plan text, all verified against the actual project state:
> (1) the web workspace additionally needed `@testing-library/jest-dom` as a
> devDependency and a `web/src/test/setup.ts` (registers the DOM matchers via
> `expect.extend` and stubs `window.matchMedia`, which jsdom does not
> implement and `useMediaQuery` needs); (2) with Vitest 5 the jest-dom 7.0.1
> type augmentation of `Assertion<T>` no longer merges (upstream issue
> testing-library/jest-dom#738, fix PR #742 pending), so every matcher vanishes
> from `tsc` while the runtime stays fine — `web/src/test/jest-dom-vitest.d.ts`
> restores the types by augmenting Vitest 5's documented `Matchers<R, T>`
> extension point, and can be deleted once jest-dom ships the fix; (3) the
> backend `webServer` entry uses `port: 3001` instead of
> `url: http://localhost:3001`: Playwright's url readiness check only accepts
> 2xx/3xx (with one `/index.html` fallback), so the route-less Express app's
> 404 made the check time out — the stub (`GET /__hits` -> 200) and Vite
> (`/` -> index.html) entries keep their `url`s; (4) the stub's fixture data
> lives in a separate `e2e/stub/fixtures.json` to stay inside the 120-line
> `max-lines` budget; (5) the root `max-lines` rule block was folded into the
> JS and TS rule blocks (identical coverage) to keep `eslint.config.js` itself
> under `max-lines`; (6) no separate `web/tsconfig.test.json`: `tsconfig.app.json`
> already typechecks `web/src` including tests and setup, and `vitest.config.ts`
> joined `tsconfig.node.json`'s include (next to `vite.config.ts`), so the
> existing `tsc -b` solution covers everything.
>
> **Revision 7 (2026-11-17, recorded during Phase 3 execution):** small
> deviations from the plan text, all verified against the actual project
> state: (1) `server/types.ts` mirrors the web TVmaze shapes — the target
> layout did not list it, but the AGENTS.md rule "types live in a `types.ts`
> file next to the code that owns them" applies and the workspaces stay
> independent (no cross-workspace import); (2) `TVMAZE_BASE_URL` is read per
> request inside `searchShows`, not once at module load, so tests can point
> the seam with `vi.stubEnv` without re-importing (default behavior
> unchanged); (3) under the server's Node typings `response.json()` is
> `Promise<unknown>` (the web DOM lib types it as `any`), so the parsed
> `search/shows` payload needs an explicit cast to `ShowSearchResult[]`;
> (4) the 502 branch additionally logs the upstream failure via
> `console.error` (the plan only mandates logging outgoing requests).
>
> **Revision 8 (2026-11-17, recorded during Phase 4 execution):** deviations
> from the plan text, all verified against the actual project state:
> (1) `ShowSearchResult` was removed from `web/src/api/types.ts` — the
> rename to `shows.ts` makes it dead, since the `{ score, show }` envelope
> is now mapped server-side and never reaches the browser; (2) the web
> `searchShows` unit tests use a plain fake response object instead of
> `Response` (the tests only need `ok`/`status`/`json()` and jsdom's
> `Response` availability is not guaranteed), and the presenter-hook tests
> mock the `@api/shows` module boundary (`vi.mock`) rather than `fetch` —
> the plan only prescribed the fetch mock for the `searchShows` tests;
> (3) the stub counts armed-failure requests as upstream hits too (the
> counter counts every `search/shows` request); (4) the E2E hit-count
> assertion reads the counter before the interaction and asserts a delta,
> because `reuseExistingServer` keeps the counter warm across runs; (5) the
> "browser network-tab" manual check was executed as a throwaway Playwright
> driver script (boot stub + Vite without the backend, search -> error
> panel, start backend -> "Retry request" -> results, full request list
> recorded: only `/api/shows`, zero `api.tvmaze.com`) — same observations,
> scripted for determinism.
>
> **Revision 9 (2026-11-17, recorded during Phase 5 execution):** deviations
> from the plan text, all verified against the actual project state:
> (1) `server/cache.ts` exports the plain-object `cache` (plus the
> `CACHE_TTL_MS` constant) so the test suites can reset it between cases —
> a test seam only; no invalidation endpoint or control is added to the
> application surface, preserving the PRD's out-of-scope rule for manual
> invalidation; (2) the cached fetch is `getCachedShows(query)` in
> `cache.ts`; `tvmaze.ts` keeps its raw `searchShows` (so the Phase 3 unit
> tests remain unchanged) and additionally exports `searchShowsUrl`, since
> the cache key is the full TVmaze request URL built from the
> `TVMAZE_BASE_URL` seam; `app.ts` routes `GET /api/shows` through
> `getCachedShows`, and the `HIT`/`MISS` lines use the Phase 3 timestamp
> format; (3) `app.test.ts` clears the cache in `beforeEach` — the
> module-level cache outlives supertest cases, so an `office` entry from
> one test would otherwise leak into the next (breaking the 502 test, for
> example); (4) the E2E cache spec (`e2e/cache.spec.js`) uses its own
> queries (`breaking`, `lost` — served from the default fixtures) because
> specs share one counting stub across parallel workers and `office` and
> `mystery` belong to `search.spec.js`, and it issues the second identical
> search after a page reload (the frontend deduplicates a re-entered query
> client-side via `lastQueryRef`, so typing it again on the same page
> would produce no backend request at all). Verified alongside: Playwright
> tears down its webServers after every run, so each run starts with a
> cold backend cache — the Phase 4 specs pass unchanged (`office` stays a
> deterministic +1; a failed upstream is never cached, so the retry in the
> fail-next spec still reaches the stub).
>
> **Revision 10 (2026-11-17, after Phase 5 verification):** at the user's
> explicit request the cache key changed from the full TVmaze request URL
> to the plain search query, superseding Revision 9 point 2:
> `server/tvmaze.ts` is back to its Phase 3 shape (no `searchShowsUrl`
> export), `getCachedShows` keys the `cache` entries by query, and the
> `HIT`/`MISS` lines log the query (real fetches still log the full URL
> via the request line). `TVMAZE_BASE_URL` is constant for a running
> process, so the query uniquely identifies its TVmaze request and the
> PRD's "keyed by the TVmaze request" stays satisfied; the equivalence
> only breaks if one process ever serves two bases, a test scenario only.
> Re-verified after the switch: unit 7/7 + 19/19, E2E 4/4, typecheck,
> lint, format:check and build green, live-API manual spot checks green.
> (Re-running E2E also surfaced that `reuseExistingServer` silently
> reuses manually started dev-loop servers on 3001 — a real-API backend
> then breaks the fixture specs; those processes were stopped, with user
> consent, before the green run.)
>
> Target layout:
>
> ```
> simple-architecture/
> ├── web/                 # frontend workspace: src/, index.html,
> │   │                    # vite.config.ts, vitest.config.ts,
> │   │                    # tsconfig*.json, scripts/, vercel.json
> │   └ package.json       #
> ├── server/              # backend workspace (TypeScript): app.ts, index.ts,
> │   │                    # tvmaze.ts, cache.ts, shows.ts, vitest.config.ts,
> │   └ package.json       # tsconfig.json; express + tsx dependencies
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
>   lints `**/*.js` with Node globals for `e2e/` and the root configs, its TS
>   block covers `web/` and — via a Node-globals override added in Phase 2 —
>   `server/`), Prettier, husky and lint-staged.
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
> The backend is TypeScript ESM (`server/package.json` declares
> `"type": "module"`), run directly with `tsx` (no build step — Vitest
> executes the TS tests natively too) and typechecked by its own
> `server/tsconfig.json` under the same strict rules as `web/` (`strict`,
> `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `erasableSyntaxOnly`)
> plus `"types": ["node"]`. Import specifiers carry no file extension, just
> like the web code (`moduleResolution: bundler` typechecks them, tsx
> resolves them at runtime). Node 24 provides global `fetch`. It listens on
> port 3001 by default (`PORT` env override); the Vite dev server proxies
> `/api` to it, so no CORS setup is needed in dev. The E2E stub listens on
> port 3002 and stays plain JS (Playwright harness code, not part of the
> backend workspace).

## Implementation Phases

### Phase 1: Split the repo into `web/` and `server/` workspaces

**Goal:** The two-folder structure exists and works: the frontend moves
into `web/` unchanged in behavior, `server/` is scaffolded as a runnable
Express workspace, and all shared tooling keeps working from the root.
Tracer bullet for the two-process, two-folder architecture.

**Affects:** frontend, backend

**Tasks:**

- [x] Turn the root `package.json` into the workspace root:
      `"workspaces": ["web", "server"]`, keep `"type": "module"` (the root
      `eslint.config.js` and `playwright.config.js` are ESM), keep the shared
      tooling devDependencies (eslint, @eslint/js, typescript-eslint, eslint
      plugins, eslint-config-prettier, globals, prettier, husky, lint-staged),
      keep root-level `lint`/`lint:fix`/`format`/`format:check`/`prepare` and
      the lint-staged config, and forward `dev`/`build`/`preview`/`typecheck`/
      `css-types` to `-w web` and `server` to `-w server`.
- [x] Create `web/package.json` (app name/scripts `dev`, `prebuild`, `build`,
      `preview`, `pretypecheck`, `typecheck`, `css-types`) with the app
      dependencies (react, react-dom, react-router-dom, clsx, lucide-react)
      and frontend devDependencies (vite, @vitejs/plugin-react, typescript,
      @types/react, @types/react-dom, @types/node).
- [x] Move the frontend into `web/`: `src/`, `index.html`, `vite.config.ts`,
      the three `tsconfig*.json` files, `scripts/` and `vercel.json` (note:
      production deployment is out of scope per the PRD, but the Vercel Root
      Directory setting must point at `web/` whenever the app is deployed
      again); delete stale root artifacts (`dist/`, `*.tsbuildinfo`).
- [x] Create `server/package.json` (`"type": "module"`, `express` dependency,
      `"server": "node index.js"` script) and `server/index.js`: an Express
      app listening on `PORT` (default 3001), no routes yet. (Shipped as
      plain JS; converted to TypeScript in Phase 2 — see Revision 5.)
- [x] Update the root `eslint.config.js` alias resolver to
      `web/src/api` and `web/src/hooks` (incl. the "keep in sync with
      vite.config.ts" comment); confirm `globalIgnores(['dist', 'coverage'])`
      still matches `web/dist` (unanchored pattern — no edit expected).
      Deviation: an edit _was_ required — see Revision 4, point (1).
- [x] Run a fresh `npm install` (single root lockfile resolving both
      workspaces) and update the structure/path references in AGENTS.md and
      README (commands stay valid through the root forwarding scripts).

**Tests:**

- [x] `npm install` succeeds with one root lockfile; `node_modules` only
      exists at the root (hoisted workspaces).
- [x] `npm run dev` serves the app at `http://localhost:5173` and searching
      behaves exactly as before the split (the frontend still calls TVmaze
      directly at this point).
- [x] `npm run build`, `npm run typecheck`, `npm run css-types`,
      `npm run lint` and `npm run format:check` all pass from the root.
- [x] `npm run server` starts Express; `curl http://localhost:3001/anything`
      returns Express's 404 response (server is up, no routes yet).
- [x] CSS Module type declarations regenerate at their new location
      (`web/src/**/*.module.css.d.ts`) with no stale files left behind.
- [x] `git status` shows the moves as renames and no gitignored artifact
      (`web/dist`, tsbuildinfo) becomes tracked.

**When ready:**

The repository is a two-workspace monorepo: `web/` builds, typechecks and
runs identically to the pre-split app, `server/` starts as an independent
Express process via `npm run server`, and every root command and git hook
works unchanged.

**Acceptance Criteria:**

- [x] The project is split into `web/` (frontend) and `server/` (backend)
      folders, each with its own `package.json`, managed as npm workspaces.
- [x] The frontend builds and behaves exactly as before the split; all
      existing root scripts and the pre-commit hook still work.
- [x] The backend workspace starts as a separate Express process.

### Phase 2: Testing instruments for web and server

**Goal:** Both workspaces have runnable Vitest suites, the backend is
structured for supertest, and a root Playwright harness with a local TVmaze
stub exists — so every later phase can write failing tests first.

**Affects:** frontend, backend

**Tasks:**

- [x] Add `web/` testing devDependencies (vitest, jsdom,
      @testing-library/react, @testing-library/user-event — plus
      @testing-library/jest-dom for the DOM matchers, see Revision 6),
      create `web/vitest.config.ts` (jsdom environment, reuses
      @vitejs/plugin-react, same `@api`/`@hooks` aliases as vite.config.ts)
      and the `"test": "vitest run"` script; write one smoke test (HomePage
      renders the search input).
- [x] Convert `server/` to TypeScript (Revision 5) and restructure it for
      testability: add devDependencies (vitest, supertest, tsx, typescript,
      @types/node, @types/express — express 5.3.0 ships no bundled types —
      @types/supertest); create `server/tsconfig.json` mirroring the web
      compiler rules (`strict`, `noUncheckedIndexedAccess`,
      `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noUnusedLocals`,
      `noUnusedParameters`, `noEmit`, `"types": ["node"]`,
      `moduleResolution: bundler` so extensionless import specifiers work);
      create `server/vitest.config.ts` (node environment) and the scripts
      `"test": "vitest run"`, `"typecheck": "tsc --noEmit"`,
      `"server": "tsx index.ts"`; export the Express app from
      `server/app.ts` and keep `server/index.ts` as the listen-on-`PORT`
      entry; supertest smoke test `server/app.test.ts` (unknown route
      returns Express's 404).
- [x] Add `@playwright/test` at the root, install the chromium browser, and
      create `playwright.config.js` with three `webServer` entries: the stub
      (`node e2e/stub/tvmaze.js`, port 3002), the backend (`npm run server`,
      env `TVMAZE_BASE_URL=http://localhost:3002`) and the frontend
      (`npm run dev`, port 5173); `testDir: 'e2e'`, baseURL
      `http://localhost:5173`. (Deviation: the backend entry uses
      `port: 3001` for readiness — see Revision 6, point 3.)
- [x] Create the E2E TVmaze stub `e2e/stub/tvmaze.js`: a plain Node HTTP
      server serving `search/shows?q=` from fixture data, counting upstream
      hits per query and exposing the counter via `GET /__hits`; write one
      Playwright smoke spec (app loads, search input visible). (Fixtures
      split into `e2e/stub/fixtures.json` for the 120-line budget — see
      Revision 6, point 4.)
- [x] Add the root scripts `"test": "npm run test --workspaces --if-present"`
      and `"test:e2e": "playwright test"`, extend the root typecheck to
      `"typecheck": "npm run typecheck --workspaces"`, and add an ESLint
      override block for `server/**/*.ts` with Node globals (the shared TS
      block currently assumes browser globals for `web/`); document
      `npm run test`, `npm run test:e2e` and the TypeScript backend
      (the AGENTS.md stack row, the `tsx` runtime) in AGENTS.md and README;
      confirm lint and format pass on all new config/spec/stub files.

**Tests:**

- [x] `npm run test` passes from the root: both workspace smoke tests are
      green.
- [x] `npm run test:e2e` passes: Playwright boots stub + backend + frontend,
      and the smoke spec sees the app with its search input.
- [x] The stub counter works: `curl http://localhost:3002/__hits` before and
      after a `search/shows?q=` call shows the per-query count incrementing
      (the basis for all later cache assertions).
- [x] `npm run typecheck` passes for both workspaces — the new server
      TypeScript code compiles under the same strict rules as web.
- [x] `npm run lint` and `npm run format:check` pass with the new files.

**When ready:**

`npm run test` and `npm run test:e2e` are part of the repo's commands, all
three harnesses (web unit, server integration, E2E with the counting TVmaze
stub) run green at smoke level, and subsequent phases can practice
test-first development.

**Acceptance Criteria:**

- [x] Vitest suites exist and pass in both workspaces (`npm run test`).
- [x] A Playwright E2E harness exists and passes (`npm run test:e2e`),
      booting the backend, the frontend and a local TVmaze stub with a
      per-query hit counter.
- [x] The backend exports its Express app separately from listening, so
      supertest can drive it without binding a port.
- [x] The test commands are documented in AGENTS.md/README.

### Phase 3: TVmaze search proxy endpoint

**Goal:** The backend owns the TVmaze interaction:
`GET /api/shows?q=<query>` fetches `search/shows?q=` (via the
`TVMAZE_BASE_URL` seam, default `https://api.tvmaze.com`), maps
`{ score, show }[]` to `Show[]` and returns it as JSON.

**Affects:** backend

**Tasks:**

- [x] Write this phase's tests first (see Tests) — they must fail before the
      implementation exists. (Verified red: 5 supertest failures + a
      collection error for the missing `./tvmaze` module before any
      implementation was written.)
- [x] Create `server/tvmaze.ts`: build requests from
      `process.env.TVMAZE_BASE_URL ?? 'https://api.tvmaze.com'` (test seam,
      default behavior unchanged); fetch `search/shows?q=` (URL-encoded),
      map the response to `show` objects, throw on a non-OK or failed
      request; log every outgoing TVmaze request to the console with a
      timestamp (the observability basis for the cache criteria in Phase 5).
- [x] Add `GET /api/shows?q=` to `server/app.ts`: 400 with an error JSON
      when `q` is missing or empty; 200 with the show array; 502 with an
      error JSON when the TVmaze request fails.
- [x] Keep files within the repo's 120-line `max-lines` lint budget by
      splitting routing from the TVmaze module as needed; confirm lint,
      format and the full suite pass. (No split needed.)

**Tests:**

- [x] `server/tvmaze.test.ts` (mocked `globalThis.fetch`): maps
      `{ score, show }[]` to show objects; URL-encodes the query; uses
      `TVMAZE_BASE_URL` when set and the real API base by default; throws on
      non-OK and network failures; logs one request line per call. (7 unit
      tests, green.)
- [x] supertest against the exported app: `GET /api/shows?q=office` returns
      200 with the fixture show array; missing and empty `q` return 400 with
      an error JSON; a failing upstream returns 502 with an error JSON and
      the app stays responsive. (5 integration tests plus the Phase 2 404
      smoke, green.)
- [x] The full Phase 2 suite still passes. (`npm run test`: web 1/1,
      server 13/13; `npm run test:e2e`: 1 passed; typecheck, lint and
      format:check green.)
- [x] Manual (real-API spot check): `npm run server` without the env seam +
      `curl ".../api/shows?q=office"` returns real TVmaze data. (Verified:
      200 with 10 real results — first "The Office" id 526; `?q=friends`
      id 431; 400 JSON for missing `q`; 404 for unknown routes; stdout
      shows one `[ISO-timestamp] TVmaze request: https://api.tvmaze.com/...`
      line per call.)

**When ready:**

`GET /api/shows?q=` returns the same show list the browser currently gets
from TVmaze, invalid input or TVmaze failure produces a proper error
response, the behavior is covered by automated tests that never touch the
external API, and the frontend is untouched — the app still works exactly as
before.

**Acceptance Criteria:**

- [x] An Express.js backend server exists in `server/` and runs as a separate
      process from the Vite dev server. (Verified this phase: `npm run server`
      boots tsx on port 3001 independently of `npm run dev`.)
- [x] The backend returns TVmaze search results as JSON and responds with
      error statuses (400/502) on bad input or TVmaze failure — verified by
      automated tests with a mocked upstream.
- [x] The `TVMAZE_BASE_URL` seam defaults to `https://api.tvmaze.com`, so
      real-API behavior is unchanged. (Default-base unit test + the live
      real-API curl above.)

### Phase 4: Frontend fetches from the backend instead of TVmaze

**Goal:** The browser stops calling `api.tvmaze.com`; all show data flows
through the backend. UX is unchanged (filtering and pagination stay
client-side for now).

**Affects:** frontend

**Tasks:**

- [x] Write this phase's tests first (see Tests) — they must fail before the
      implementation existed. (Verified red: web unit suites failed on the
      missing `./shows`/`@api/shows` modules; both `e2e/search.spec.js`
      tests failed — no results through the blocked direct path, and the
      stub's `/__fail-next` control answered 404.)
- [x] Add a dev-server proxy in `web/vite.config.ts`: `/api` ->
      `http://localhost:3001`.
- [x] Rename `web/src/api/tvmaze.ts` to `web/src/api/shows.ts` and change
      `searchShows` to fetch `/api/shows?q=` (same signature, same
      `AbortSignal` support, same non-OK handling — the thrown message is
      unchanged); update the import in `useShowsDataFetching.ts`. (The now
      dead `ShowSearchResult` shape was removed from `web/src/api/types.ts`
      — the `{ score, show }` envelope never reaches the browser anymore.)
- [x] Extend the E2E stub with a fail-next control (`POST /__fail-next`
      arms the next `search/shows` call to return 500) so the error-panel
      and retry flow becomes deterministic in E2E. (Armed failures still
      count as upstream hits — the counter counts every `search/shows`
      request.)
- [x] Document how to run the two processes (`npm run server` + `npm run dev`)
      in the README or AGENTS.md commands section. (README gained a
      "Running the app" section plus the `/api` proxy and stub-control
      notes; the AGENTS.md commands list already documents both scripts and
      its API stack-table row stays a Phase 7 sync item per the plan.)

**Tests:**

- [x] Web unit tests: `searchShows` calls `/api/shows?q=` with the encoded
      query, returns the shows, throws on non-OK responses and propagates
      the `AbortSignal` (mocked fetch); presenter-hook tests with fake
      timers: the debounce fires a single request and a query change aborts
      the in-flight one. (`web/src/api/shows.test.ts` 4 tests +
      `useShowsSearchField.test.ts` 2 tests, green.)
- [x] `e2e/search.spec.js`: typing a query renders the fixture result cards;
      the stub counter shows exactly 1 upstream hit; a route interceptor
      records zero browser requests to `api.tvmaze.com`. (Counter asserted
      as a delta so reruns against the reused stub stay deterministic.)
- [x] E2E error flow: with fail-next armed, a search shows the existing
      error panel; clicking "Retry request" renders the results (fail-next
      consumed, backend stays up). (Second test in `e2e/search.spec.js`.)
- [x] `npm run typecheck`, `npm run lint`, `npm run test` and
      `npm run test:e2e` all pass. (web 7/7, server 13/13, Playwright 3/3;
      lint, typecheck and format:check clean.)
- [x] Manual: browser network-tab spot check (only `/api/shows` requests for
      show data); with the backend stopped, the error panel appears and
      retry succeeds after restarting it. (Verified with a throwaway
      Playwright driver script: stub + Vite without the backend — search
      showed "Something went wrong." (Vite proxy ECONNREFUSED); after
      starting the backend, "Retry request" rendered the fixture results;
      the recorded request list contained only
      `localhost:5173/api/shows?q=office`, zero `api.tvmaze.com`.)

**When ready:**

The app is fully functional through the backend: every search goes
browser -> Vite proxy -> Express -> TVmaze (or the stub in E2E), no browser
request touches `api.tvmaze.com`, and loading/error/retry behavior is
unchanged and covered by automated tests.

**Acceptance Criteria:**

- [x] Using the app produces no browser network requests to `api.tvmaze.com`;
      all show data comes from the backend — asserted by the E2E route
      interceptor. (Plus the recorded request list in the manual check.)
- [x] When TVmaze fails (or the backend is down), the backend path reports an
      error and the UI shows its existing error state with a working retry —
      covered in E2E via the stub's fail-next control. (Backend-down case
      additionally proven by the manual check: Vite proxy ECONNREFUSED ->
      error panel -> retry recovers.)
- [x] Existing UI behavior is preserved: loading and error states work, and
      the search flow (debounce, abort, reset on new search) is unchanged —
      covered by web unit tests. (Debounce, abort and the re-request for the
      new query are asserted in `useShowsSearchField.test.ts`; the
      client-side filtering/pagination code was not touched, the smoke test
      still passes and loading/error rendering is covered by the E2E
      search/error specs.)

### Phase 5: TVmaze response cache (plain object, 5-minute TTL)

**Goal:** Repeated identical TVmaze requests within 5 minutes are served from
an in-memory plain-object cache, reducing requests to the external API — the
primary goal of the feature. Transparent to the frontend.

**Affects:** backend

**Tasks:**

- [x] Write this phase's tests first (see Tests) — they must fail before the
      implementation exists. (Verified red: `cache.test.ts` and
      `app.test.ts` failed to collect on the missing `./cache` module; the
      E2E cache spec failed with 2 upstream hits instead of 1.)
- [x] Create `server/cache.ts` with `const cache = {}` keyed by the TVmaze
      request URL (including the encoded query), storing
      `{ data, fetchedAt }` per entry; define the TTL constant
      `5 * 60 * 1000`. (Keyed by the plain search query — Revision 10
      supersedes the request-URL key; exported `cache` + `CACHE_TTL_MS` —
      Revision 9, point 1.)
- [x] Implement the cached fetch: if an entry exists and is younger than
      5 minutes, return its data without calling TVmaze; if the cache is
      empty or the entry is outdated, fetch TVmaze and store/overwrite the
      entry. Failed TVmaze requests must not create or refresh cache entries.
      (`getCachedShows(query)` in cache.ts — Revision 10; the store happens
      only after the awaited fetch resolves, so a rejection leaves the
      cache untouched, unit-asserted.)
- [x] Route the Phase 3 endpoint's TVmaze access through the cached fetch and
      log `HIT`/`MISS` (with the cache key) for every request. (`app.ts`
      imports `getCachedShows`; the `HIT`/`MISS` lines log the query key —
      Revision 10 — and real fetches still log the full URL.)

**Tests:**

- [x] `server/cache.test.ts` with fake timers (`vi.useFakeTimers`): the first
      call fetches and stores (MISS); an identical call within 5 minutes
      returns the cached data with the upstream fetch called exactly once
      (HIT); advancing the clock past 5 minutes makes the next call refetch
      and update the entry (the following call is a HIT again); different
      queries are cached independently; a failed fetch neither creates nor
      refreshes an entry. (5 unit tests, green.)
- [x] supertest: two identical `GET /api/shows?q=office` calls return
      identical JSON with the upstream fetch called once. (Green — the
      second call also proves the cached data, not the re-mocked payload,
      is served; per-test cache reset — Revision 9,
      point 3.)
- [x] E2E cache spec: searching the same query twice keeps the stub counter
      at 1; a different query raises it to 2. (The 5-minute expiry is not
      exercised in E2E — it is covered deterministically by the fake-timer
      unit tests.) (Green — dedicated queries + reload semantics per
      Revision 9, point 4; Playwright 4/4, Phase 4 specs unaffected.)
- [x] Manual: `HIT`/`MISS` lines are visible in the server log; restarting
      the server clears the cache (first request is a MISS). (Verified
      against the live API after Revision 10: office logged a `cache MISS`
      plus the full-URL request line; the identical second call logged
      only a `cache HIT` (no request line) with a byte-identical (SHA-256)
      response; `friends` logged its own `MISS`; after a clean restart
      (killing the port owner until zero listeners) office was a `MISS`
      again.)

**When ready:**

The server makes at most one TVmaze request per distinct query per 5 minutes;
cache behavior is proven by automated tests without real-time waiting, is
observable via `HIT`/`MISS` logs, and the app behaves identically from the
user's perspective.

**Acceptance Criteria:**

- [x] TVmaze responses are stored in a plain object cache (`const cache = {}`)
      keyed by the TVmaze request. (Keyed by the search query — one-to-one
      with the `search/shows` request URL within a process per Revision
      10; entry shape `{ data, fetchedAt }` asserted in the MISS test.)
- [x] Repeating an identical search within 5 minutes returns the cached data
      and makes no new request to TVmaze (automated tests + server logs).
      (Fake-timer HIT unit test, supertest repeat test, E2E counter
      assertion, and the manual `cache HIT` log line.)
- [x] Repeating an identical search more than 5 minutes after the cached
      request makes a new TVmaze request and updates the cache entry —
      proven by fake-timer tests without real-time waiting. (`vi.advanceTimersByTime(CACHE_TTL_MS)`
      refetch test, entry `fetchedAt` moves, next call is a HIT again.)
- [x] Different search queries are cached independently of each other.
      (Distinct URL keys — fake-timer unit test, the E2E spec's
      `breaking`/`lost` counter pair and the manual `friends` `MISS`.)

### Phase 6: Backend genre filtering and pagination endpoint

**Goal:** A new endpoint `GET /api/search?q=&genre=&page=` that filters by
genre and paginates on the backend, returning the page slice plus the
metadata the UI needs (total matching count, genres present in the unfiltered
result set). The Phase 3 endpoint stays untouched so the app keeps working.

**Affects:** backend

**Tasks:**

- [ ] Write this phase's tests first (see Tests) — they must fail before the
      implementation exists.
- [ ] Create `server/shows.ts` with the result-processing helpers and the
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
- [ ] Add `GET /api/search?q=&genre=&page=` to `server/app.ts` returning
      `{ shows, page, pageCount, totalCount, genres }` as JSON; 400 when `q`
      is missing; data source is the cached TVmaze fetch from Phase 5 (no
      per-page/per-genre caching).

**Tests:**

- [ ] `server/shows.test.ts`: genre collection is sorted and deduplicated;
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
