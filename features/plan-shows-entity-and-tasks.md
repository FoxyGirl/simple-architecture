# Plan: Shows Entity (Redux Store) and Fetch Tasks

**PRD:** features/prd-shows-entity-and-tasks.md

**Date:** 2026-11-18

> **Approach.** The feature is frontend-only (backend changes are out of scope
> per the PRD), so every phase affects `web/`. Phases follow the dependency
> order of the documented Simple Architecture layers: Entity/Store first, then
> the API layer the Tasks will consume, then the Tasks, and finally the
> HomePage rewiring that connects Presenter -> Tasks -> API -> Entity. Each
> phase leaves the app fully functional: the new layers are added and
> unit-tested in isolation before any existing consumer changes, and the last
> phase swaps the HomePage over and deletes the direct-fetch machinery.
>
> **Testing.** The repository practices red -> green: each phase writes its
> automated tests before the implementation. No new E2E specs are created —
> the PRD mandates identical user-visible behavior, so the existing Playwright
> suites (`smoke`, `search`, `browse`, `cache`) act as the regression gate and
> run in every phase. Unit/integration tests live in colocated `tests/`
> folders per the repository conventions (Vitest, jsdom + Testing Library for
> page-level suites, `vi.mock` at the `@api/shows` module boundary as
> established by the existing flow tests).
>
> **Constraints carried through every phase:** source files <= 120 lines
> (ESLint `max-lines`), TypeScript strict (`noUncheckedIndexedAccess`,
> `verbatimModuleSyntax`, `erasableSyntaxOnly`), object shapes as `type`
> aliases in `types.ts` next to their owner, extensionless import specifiers,
> cross-directory imports via aliases kept in sync across `vite.config.ts`,
> `vitest.config.ts`, `eslint.config.js` and `tsconfig.app.json`.

## Implementation Phases

### Phase 1: Redux store and shows Entity

**Goal:** `web/` depends on Redux Toolkit and `react-redux`; a Redux store is
created and provided at the application root; a shows Entity (slice) owns the
current search result — the shows list plus `page`, `pageCount`, `totalCount`
and `genres` — with actions, reducers, selectors and state types as its public
API. The app itself behaves exactly as before (nothing consumes the store
yet). Tracer bullet for the Entity layer.

**Affects:** frontend

**Tasks:**

- [x] Write the Entity tests first (see Tests) in a colocated `tests/` folder
      of the store module's directory — they must fail before the
      implementation exists.
- [x] Add `@reduxjs/toolkit` and `react-redux` to the `web/` workspace
      dependencies in versions compatible with React 19 and the strict
      TypeScript 6 configuration; run `npm install` from the root (single
      lockfile). _(Installed `@reduxjs/toolkit@^2.14.0` and
      `react-redux@^9.3.1`.)_
- [x] Decide the store placement from the documented organization rules
      (ownership, `index.ts` barrels, import aliases) — the PRD leaves it
      open; the natural candidate is a new top-level `web/src/store/` folder
      whose barrel publishes the store, the root state/dispatch types and the
      Entity's actions and selectors. Record the decision. _(Decision:
      `web/src/store/` — `store.ts` (configureStore), `types.ts`
      (`RootState`/`AppDispatch`) and an `index.ts` barrel publishing the
      store, the root types and the shows Entity's actions/selectors/state
      type; the reducer is published by the Entity's own barrel and consumed
      only by `store.ts`. The Entity lives in `web/src/store/shows/`:
      `showsSlice.ts` (`createSlice`), `selectors.ts`, `types.ts`
      (`ShowsState` = `SearchPage` from `@api/types`), plus colocated
      `tests/`.)_
- [x] Implement the shows Entity with `createSlice`: state type declared as a
      `type` alias in the Entity's `types.ts` (reusing the `SearchPage` shape
      from `@api/types` for the data model), an empty initial state, a reducer
      that stores a fetched search result, and selectors exposing the shows
      list and the `page`/`pageCount`/`totalCount`/`genres` metadata. No
      request status, no other UI-related state, no presentation logic.
- [x] Wire the store at the application root: wrap `<App />` in
      `<Provider store={...}>` in `web/src/main.tsx`.
- [x] If the chosen placement is crossed by directory-boundary imports (store
      consumed from `pages/` in later phases), register the frontend alias
      (e.g. `@store`) in all four configs in sync: `web/vite.config.ts`
      (`resolve.alias`), `web/vitest.config.ts`, root `eslint.config.js`
      (alias resolver) and `web/tsconfig.app.json` (`compilerOptions.paths`).
      _(`@store` registered in all four configs in sync; the alias table in
      `docs/coding-conventions.md` was updated to document it.)_
- [x] Verify independence and the line budget: the store/Entity modules import
      nothing from Views, Presenters or Tasks; every new file stays within
      120 lines; run `npm run typecheck`, `npm run lint`, `npm run test` and
      `npm run test:e2e` — all existing suites pass unchanged (the page tests
      render `HomePage` without a Provider because it does not consume the
      store yet). _(Store modules import only `@reduxjs/toolkit`,
      `@api/types` and their own files; largest new file is 77 lines; all
      suites green.)_

**Tests:**

- [x] Entity unit tests (red -> green): the reducer stores a `SearchPage`
      payload (shows list + `page`, `pageCount`, `totalCount`, `genres`); the
      selectors return each piece from the store; the initial state is empty;
      the state shape contains no request-status or UI-related field.
- [x] Store smoke: the store is created with the Entity reducer and its
      `dispatch`/selectors round-trip a result (plain store, no React).
- [x] All pre-existing suites stay green untouched: `npm run test` (web +
      server) and `npm run test:e2e` (4 Playwright specs). _(The suite
      actually contains 5 specs; all 5 pass.)_
- [x] Manual: `npm run server` + `npm run dev` — the app loads and a search
      behaves exactly as before the phase. _(Verified: the dev server serves
      the app and `/api/search` through the Vite proxy returned the correct
      envelope; the green Playwright suite additionally proves the real
      browser flow with the `Provider` mounted.)_

**When ready:**

The Redux store exists and is provided at the application root, the shows
Entity exposes actions/reducers/selectors/state types as its public API with
no UI-related state and no dependencies on Views/Presenters/Tasks, and the
running app plus every existing suite is unchanged.

**Acceptance Criteria:**

- [x] The `web/` workspace depends on Redux Toolkit and `react-redux`; a Redux
      store is created and provided at the application root, and
      `npm run typecheck`, `npm run lint`, `npm run test` and
      `npm run test:e2e` pass.
- [x] The Entity stores the current search result — the shows list plus
      `page`, `pageCount`, `totalCount` and `genres` — and exposes actions,
      reducers, selectors and state types as its public API.
- [x] The Entity contains no request status or other UI-related state, no
      presentation logic, and no dependencies on Views, Presenters or Tasks.
- [x] The Entity behavior is covered by automated tests in a colocated
      `tests/` folder.

### Phase 2: API layer — configurable base URL and centralized request handling

**Goal:** `web/src/api/` completes the API layer: a configurable base URL for
the external server whose default preserves the current same-origin `/api`
behavior, plus centralized request configuration, response handling and error
handling. Consumers keep using only the function interface
(`searchShowsPage`); the dev proxy flow and the Playwright E2E flow are
unchanged with the default configuration.

**Affects:** frontend

**Tasks:**

- [x] Write this phase's API tests first (see Tests), extending the colocated
      `web/src/api/tests/` suite — they must fail before the implementation
      exists. _(Added `buildUrl.test.ts` and `request.test.ts` and extended
      `shows.test.ts`; red confirmed (suites failed on the unresolvable
      `../config`/`../request`/`../errors` imports), then green.)_
- [x] Introduce the base-URL configuration in `web/src/api/`: a configured
      value that prefixes every API request, with a default that preserves the
      current relative same-origin `/api/...` URLs (so the Vite dev proxy and
      the E2E harness keep working). The concrete seam (a config module with a
      setter vs. an `import.meta.env` variable stubbable via `vi.stubEnv`) is
      an implementation decision — the PRD only requires configurability, the
      unchanged default, and test verifiability. _(Decision:
      `import.meta.env.VITE_API_BASE_URL` read at call time through
      `web/src/api/config.ts` (`getApiBaseUrl()`); the default (unset) yields
      an empty base and byte-identical relative URLs. The variable is typed
      by an `ImportMetaEnv` augmentation in `web/src/vite-env.d.ts`; tests
      stub it with `vi.stubEnv` — no exported mutable state was added.)_
- [x] Centralize request configuration (URL building and query-parameter
      encoding), response handling (JSON parsing of the `SearchPage` envelope)
      and error handling (normalized errors for non-OK/failed responses)
      inside the API layer, keeping the `searchShowsPage(query, selection,
{ signal })` function interface stable so the current consumer
      (`useShowsDataFetching`) needs no changes. _(`web/src/api/request.ts`
      owns URL building and percent-encoding (`buildApiUrl`, the `QueryParam`
      pairs typed in `api/types.ts`) plus response handling (`requestJson`
      parses the JSON envelope); non-OK responses become `ApiError`
      (`web/src/api/errors.ts`) carrying the HTTP status, while aborts
      propagate unchanged as `AbortError`. The old message
      "TVmaze search failed with status N" became the normalized
      "API request failed with status N" — only asserted in the API's own
      suite; consumer suites mock the module boundary. `shows.ts` just
      assembles the `/api/search` params now.)_
- [x] Verify the encapsulation rules: no `fetch` call or request building
      outside `web/src/api/`, no low-level HTTP details in the function
      interface, and no `web/` module imports from the `server/` directory
      (inspection/grep); new and touched files stay within 120 lines. _(grep:
      the only `fetch(` in `web/src` is `api/request.ts`; the remaining
      `/api/search` occurrences outside `api/` are prose comments; no
      `server/` imports anywhere in `web/src`; largest new/touched file is
      `shows.test.ts` at 110 lines.)_
- [x] Run the full verification: `npm run typecheck`, `npm run lint`,
      `npm run test` (both workspaces) and `npm run test:e2e` green with the
      default configuration. _(typecheck and lint exit 0 with no warnings;
      web 32 tests / 9 files, server 30 tests / 5 files; Playwright 5/5
      passed.)_
- [x] Manual default-flow check: `npm run server` + `npm run dev` — search,
      genre filter, pagination and retry all work through the Vite proxy
      exactly as before. _(Verified against the running pair: the proxied
      `/api/search` returned the correct envelope, genre/page params reached
      the backend and the backend's page-clamping and empty-query 400 stayed
      unchanged (server-side, untouched by this phase); the green E2E suite
      proves the retry flow in a real browser.)_

**Tests:**

- [x] API unit tests (mocked `fetch`, red -> green): with the default
      configuration the request URL stays the relative
      `/api/search?q=...&genre=...&page=...` (existing URL assertions keep
      passing); with a changed configured base URL the same
      `searchShowsPage` call requests `<base>/api/search?...` without any
      caller code change; the envelope is returned from the response; a
      non-OK response produces the normalized error; the `AbortSignal` still
      propagates to `fetch`. _(All five covered: the pre-existing relative
      URL assertions pass unchanged in `shows.test.ts`; the configured-base
      assertion exists both at the builder level (`buildUrl.test.ts`) and on
      the public `searchShowsPage` interface with `vi.stubEnv`
      (`shows.test.ts`); envelope return asserted in both suites; normalized
      `ApiError` with `status` asserted in `request.test.ts` and through
      `shows.test.ts`; signal propagation asserted in `request.test.ts` and
      the existing `shows.test.ts` case.)_
- [x] The existing consumer suites (`searchFlow.test.tsx`,
      `searchRendering.test.tsx`, `useShowsSearchField.test.ts`) stay green
      unchanged — the function interface is stable. _(Untouched; all pass —
      32 web tests across 9 files.)_
- [x] `npm run test:e2e`: all existing Playwright specs pass with the default
      configuration (browser requests still reach the Express backend through
      the proxy). _(5/5 specs passed — identical to the baseline run.)_

**When ready:**

All API requests follow the configured base URL (proven in tests), the default
configuration leaves the dev and E2E flows byte-identical in behavior, and
request configuration, response handling and error handling exist only inside
`web/src/api/`.

**Acceptance Criteria:**

- [x] The API layer uses a configurable base URL: changing the configured
      value redirects all API requests to a different server without code
      changes in Presenter, Tasks or Entity (verified in tests).
- [x] With the default configuration, the dev flow (`npm run dev` +
      `npm run server`) and the E2E flow are unchanged: browser requests still
      reach the Express backend and the existing Playwright specs pass.
- [x] The API layer encapsulates request configuration, response handling and
      error handling; consumers use only its function interface, and no `web/`
      module imports from the `server/` directory.
- [x] The API behavior is covered by automated tests in the colocated
      `web/src/api/tests/` folder.

### Phase 3: Shows-fetching Tasks

**Goal:** The HomePage `logic/tasks/` folder contains the shows-fetching
business operations as plain TypeScript functions: they call the API layer for
data, update the store via `store.dispatch`, receive query/genre/page through
explicit arguments, return the operation result to the caller, and own the
abort of superseded in-flight requests. Additive phase — the running app still
uses the old machinery; the Tasks are proven in isolation.

**Affects:** frontend

**Tasks:**

- [ ] Write the Task tests first (see Tests) in
      `web/src/pages/HomePage/logic/tasks/tests/` — they must fail before the
      implementation exists.
- [ ] Create `web/src/pages/HomePage/logic/tasks/` and the shows-fetch Task
      (e.g. `fetchShowsPage.ts`): an ordinary async TypeScript function — no
      React component, no hook — accepting all required data (query, genre,
      page) as explicit arguments, performing HTTP only through the API layer,
      updating the store only via `store.dispatch` on success, and returning
      the operation result (success/failure) to the Presenter.
- [ ] Move the in-flight coordination from `useShowsDataFetching` into the
      Task layer: every run aborts the previous in-flight request, an aborted
      (superseded) response never dispatches to the store, and the task module
      exposes an abort of the current in-flight request (needed later by the
      search field's discard/cleanup path). Keep task-owned coordination state
      out of Redux.
- [ ] Enforce the Task constraints in the implementation: no `fetch` or URL
      building inside task files, no `store.getState()`, no selector usage, no
      React/hook imports; every file within the 120-line budget (split with
      private helper modules if needed).
- [ ] Run `npm run typecheck`, `npm run lint` and `npm run test` green; the
      app and the E2E suite are unaffected (the Tasks are not consumed yet).

**Tests:**

- [ ] Task unit tests (red -> green; `vi.mock` at the `@api/shows` boundary,
      dispatch asserted against store state with per-case isolation): the Task
      calls the API function with exactly the explicit query/genre/page
      arguments; on success it dispatches the Entity action with the fetched
      `SearchPage` and returns a success result; on a real API failure it
      returns an error result and dispatches nothing (no stale data); a
      superseded run (previous request aborted by a newer one) neither
      dispatches nor overwrites the newer data in the store; aborting the
      in-flight request leaves the store untouched.
- [ ] Constraint coverage: the task file exposes only the plain function
      interface (no hooks), verified by the suite importing it without React.
- [ ] All pre-existing suites stay green: `npm run test` (web + server);
      `npm run test:e2e` unaffected.

**When ready:**

The shows-fetching operations exist as Task functions in the documented
`logic/tasks/` folder, unit-proven to fetch only through the API layer, update
the store only via `store.dispatch`, take all data as explicit arguments and
handle supersede/abort — while the running application is unchanged.

**Acceptance Criteria:**

- [ ] Shows fetching is implemented as Task functions — plain TypeScript, no
      React hooks — located in the HomePage `logic/tasks/` folder.
- [ ] Tasks perform HTTP communication only through the API layer (no `fetch`
      or request building inside task files) and update the store only via
      `store.dispatch` (no `store.getState()` and no selector usage inside
      tasks).
- [ ] Tasks receive all required application data (query, genre, page) through
      explicit function arguments.
- [ ] A superseded in-flight request does not overwrite the newer data in the
      store.
- [ ] The Task behavior is covered by automated tests in the colocated
      `logic/tasks/tests/` folder.

### Phase 4: Rewire the HomePage to Presenter, Tasks and Entity

**Goal:** The HomePage follows the documented Simple Architecture end to end:
the Presenter lives at `logic/useHomePage.ts`, reads the shows data from the
store through selectors, and initiates fetching only through Tasks; request
status (`idle`/`loading`/`success`/`error`), the query echo and the genre/page
selection remain presenter-managed presentation state; `useShowsDataFetching`
is deleted; all existing user-visible behavior is preserved and the complete
suite (unit + integration + E2E) is green.

**Affects:** frontend

**Tasks:**

- [ ] Update the page-level tests first: wrap the `HomePage` renders in the
      Redux `Provider` (the `HomePage.test.tsx`, `searchFlow.test.tsx`,
      `searchRendering.test.tsx` suites and the shared `test/home-flow.ts`
      helper) and add the store-read assertions (after a successful search /
      genre change / page change the Entity state equals the API payload and
      the rendered shows come from it through the Presenter's selectors);
      keep every existing behavior assertion (loading/error panels, resets,
      dedup, abort, retry). The new assertions are red against the current
      code.
- [ ] Move the Presenter to `web/src/pages/HomePage/logic/useHomePage.ts`:
      consume the Entity through selectors (react-redux), keep
      status/queryEcho/selection plus the reset rules (new search resets
      genre and page, genre change resets page to 1) and the current-query
      deduplication (`isCurrentQuery`) as presenter-owned presentation state,
      invoke the Tasks with explicit query/genre/page arguments, translate the
      returned Task results into the loading/success/error status, and make
      retry re-invoke the Task with the current request.
- [ ] Delete `useShowsDataFetching.ts` and wire the search field's
      discard/cleanup path (`abortSearch` on query change/clear) to the Task
      layer's abort; the field presenter (`useShowsSearchField`) keeps its
      debounce and prop interface unchanged.
- [ ] Update `HomePage.tsx` to import the Presenter from `./logic/useHomePage`;
      the View's JSX, props flow and styling stay untouched (no visual/UX
      change), and the View never accesses the store directly.
- [ ] Respect the boundaries and budgets: the Presenter stays within 120 lines
      (it MAY delegate to smaller specialized hooks per
      `docs/architecture.md`); the Presenter contains no `fetch`/API calls and
      dispatches no Redux actions directly; update the `home-flow.ts` helper
      within its own 120-line budget.
- [ ] Sync the documentation that describes the changed frontend structure:
      the README `web/` tree (presenter path, `store/`, `logic/tasks/`) and
      the AGENTS.md stack table (Redux Toolkit + react-redux as the state
      layer), keeping the documented rules themselves unchanged.
- [ ] Run the full verification: `npm run typecheck`, `npm run lint`,
      `npm run test` (both workspaces), `npm run test:e2e` and
      `npm run build`; manual dev-flow check (`npm run server` +
      `npm run dev`): search, genre filter, pagination, retry, clear, and
      rapid re-typing (superseded request) all behave as before.

**Tests:**

- [ ] Provider-wrapped page suites green (red -> green on the new store
      assertions): submitting a search requests page 1 with no genre; a genre
      change requests page 1 with that genre; a page change requests that
      page; a new search resets genre and page; an in-flight request is
      aborted when a newer one starts; the error panel renders on failure and
      "Retry request" re-issues the current request; skeletons/loading states
      render as before.
- [ ] Store-read assertions: the shows rendered by HomePage after a
      successful search, genre change or page change are read from the store
      through the selectors used by the Presenter (verifiable via store state
      inspection in the suites).
- [ ] `npm run test:e2e`: all existing Playwright specs pass unchanged — they
      are the equivalence gate for the rewiring (no new E2E behavior exists).
- [ ] `npm run typecheck`, `npm run lint`, `npm run build` green; no reference
      to the deleted `useShowsDataFetching` remains (compiler/ESLint report no
      unresolved or unused imports).

**When ready:**

The HomePage is fully rewired to the documented architecture: Presenter at
`logic/useHomePage.ts` consuming the Entity through selectors and orchestrating
the Tasks in `logic/tasks/`, the direct-fetch machinery deleted, the complete
automated suite (unit + integration + E2E) green, and the user-visible
behavior identical to the pre-feature app.

**Acceptance Criteria:**

- [ ] After a successful search, genre change or page change, the shows
      rendered by HomePage are read from the store through selectors used by
      the Presenter.
- [ ] The Presenter initiates fetching only by invoking Tasks and never calls
      the API layer or `fetch` directly; the Tasks live in the HomePage
      `logic/tasks/` folder.
- [ ] The HomePage Presenter lives at `logic/useHomePage.ts` and the former
      direct-fetch helper (`useShowsDataFetching`) no longer exists.
- [ ] Existing user-visible behavior is preserved: loading and error states
      render as before, a new search resets genre and page, a genre change
      resets the page to 1, retry re-issues the current request, and a
      superseded in-flight request does not overwrite newer results.
- [ ] `npm run typecheck`, `npm run lint`, `npm run test` and
      `npm run test:e2e` pass with the rewired page.
