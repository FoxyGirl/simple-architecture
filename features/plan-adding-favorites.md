# Plan: Adding Favorites

**PRD:** features/prd-adding-favorites.md

**Date:** 2026-11-19

> **Approach.** Client-side favorites already exist (Redux `store/favorites`
> holding full `Show` objects, the synchronous `toggleShowFavorite` Task, the
> heart `FavoriteButton` in `pages/components/`, and a flat `FavoritesPage`),
> while the backend serves only `/api/search`. The PRD makes the backend the
> single source of truth, so Phase 1 builds the complete backend favorites
> API first (storage -> routes -> supertest) — the minimum work path every
> later phase consumes. Phase 2 adds the frontend layers the migration needs
> (API module, Entity extension, read Tasks) purely additively, keeping the
> running app untouched; Phase 3 performs the atomic switch: hearts on both
> pages, the paginated FavoritesPage with its back button, and the deletion
> of the legacy client-side storage. The remaining user-visible features
> stack on the migrated flow one phase each: toasts (4), the HomePage count
> button (5), HomePage state restoration (6). A later tooling decision
> adopted the **Sonner** library as the app-wide toast system: Phase 7 —
> executed directly after Phase 4 and before Phases 5–6 — replaced the
> hand-rolled Toast component with one global Sonner toaster behind a
> library-independent `notify` API, keeping the Phase 4 user-visible
> behavior unchanged. Every phase leaves the app fully functional, so work
> can stop after any completed phase.
>
> **Testing.** Red -> green per AGENTS.md: each phase writes its automated
> tests before the implementation. Backend suites are colocated unit tests
> plus an app-level supertest suite in `server/tests/`; frontend suites mock
> at the `@api/favorites` module boundary (the established pattern of the
> flow suites). All favorites-mutating E2E flows live in one
> `e2e/favorites.spec.js`: Playwright runs spec files in parallel workers
> against the one shared backend, so a single file keeps favorites mutations
> sequential. Because `reuseExistingServer` keeps the backend (and its
> in-memory favorites) warm across runs, the spec establishes a deterministic
> starting state through the backend API via Playwright's request context —
> no backend test-only endpoints are added beyond the exported `favorite`
> storage reset seam mirroring the existing `cache` seam. Phases 1–2 change
> no user-visible behavior, so the existing 5 Playwright specs act as the
> regression gate there; from Phase 3 on, E2E assertions are written before
> the corresponding implementation.
>
> **Design canvas.** The pen.dev MCP tools report the plan usage limit
> reached for this billing period, so canvas mirroring of the new visual
> elements (toast, count button, FavoritesPage back button, favorites
> pagination) is recorded as a deferred follow-up in the phase that
> introduces them; `.pen` files must never be edited outside the MCP design
> tools. New styling uses the existing tokens in `web/src/styles/tokens.css`.
>
> **Constraints carried through every phase:** source files <= 120 lines
> (ESLint `max-lines`), TypeScript strict (`noUncheckedIndexedAccess`,
> `verbatimModuleSyntax`, `erasableSyntaxOnly`), object shapes as `type`
> aliases in the owning `types.ts`, extensionless import specifiers,
> `index.ts` barrels publishing Views/routers only, aliases (`@api`,
> `@notification`, `@store`, `~`) kept in sync across all declaring
> configs, CSS Modules with
> generated `.d.ts` (`npm run css-types` after every new/changed module) +
> `clsx` + design tokens, navigation only at Presenter level, Views never
> touching store or router, Tasks as plain functions with explicit arguments
> and `store.dispatch` only (no `getState`/selectors/React). Note: AGENTS.md
> references `rules/react-memoization.md`, which is absent from the working
> tree — follow the `react-hooks` ESLint rules and the `useCallback`
> guidance in `docs/coding-conventions.md` instead.

## Implementation Phases

### Phase 1: Backend favorites storage and API

**Goal:** The Express backend owns favorites data and logic: an in-memory
plain-object storage keyed by the TVmaze show id and four endpoints under
`/api` — add, remove, count (carrying the favorite ids the heart states
need), and a paginated list at 3 per page. The frontend is untouched; the
API is fully proven by unit + supertest suites. Tracer bullet: the
foundation every later phase consumes.

**Affects:** backend

**Tasks:**

- [x] Extract the pagination helpers both routes will share
      (`RESULTS_PER_PAGE`, `getPageCount`, `clampPage`, `getPageShows`) from
      the private `server/routes/search/shows.ts` into their own backend
      module with an `index.ts` barrel — per the organization rule, helpers
      reused by several routes move to the nearest common ancestor (proposed
      `server/pagination/`; record the decision). Move their unit tests
      along and update the search route's imports; the genre helpers
      (`collectGenres`, `filterShowsByGenre`, `buildSearchPage`) stay
      search-private and every search suite stays green.
- [x] Write this phase's tests first (see Tests): the storage/helper unit
      suite in `server/routes/favorites/tests/` and the app-level supertest
      suite in `server/tests/` — both red before the implementation exists.
- [x] Implement the favorites storage module inside
      `server/routes/favorites/`: the exported plain object `favorite`
      (`Record<number, Show>` — the test-reset seam mirroring `cache`) plus
      pure add/remove/summary/list-page helpers preserving insertion order;
      the helpers never call TVmaze. Route-owned types live in the folder.
- [x] Implement the favorites router and mount it: `POST /api/favorites`
      (JSON body `{ show }`; 400 `{ error }` on a missing or invalid show),
      `DELETE /api/favorites/:id` (400 on a non-numeric id; an unknown id is
      a no-op — record the decision), `GET /api/favorites/count` returning
      `{ count, ids }`, and `GET /api/favorites?page=` returning the list
      envelope `{ shows, page, pageCount, totalCount }` with an advisory,
      clamped page mirroring the search route's pattern. Add and remove
      respond with the updated `{ count, ids }` summary so clients sync
      without refetching. Publish
      the router through the folder barrel + `routes/index.ts`, mount it in
      `app.ts`, and add `express.json()` body parsing there (the first POST
      route of the app).
- [x] Sync the backend documentation: the README `server/` tree (the new
      `routes/favorites/` folder and the shared pagination module) and the
      README/AGENTS.md backend description (the server now serves
      `/api/search` plus the favorites endpoints).
- [x] Verify: `npm run typecheck`, `npm run lint` and `npm run test` green
      in both workspaces, `npm run test:e2e` unaffected; manual
      `npm run server` round through the four endpoints, including the
      restart-clears-favorites observation.

**Tests:**

- [x] Storage/helper unit tests (red -> green): adding stores the full show
      snapshot keyed by its id; adding the same id twice keeps one entry;
      removing deletes the entry and removing an unknown id is a no-op; the
      summary is `{ count, ids }` in insertion order; the list-page helper
      slices 3 per page, clamps the requested page into `[1, pageCount]`,
      reports `totalCount`, and an empty storage yields one empty page.
- [x] Supertest app-level suite (red -> green, storage reset in
      `beforeEach`): POST adds -> 200 with the updated summary; POST without
      a valid show body -> 400 `{ error }`; GET count reflects adds and
      removes; GET list page 2 returns the second slice with correct
      metadata; DELETE removes -> updated summary; the favorites routes make
      no upstream calls (the stubbed global `fetch` is never invoked).
- [x] All pre-existing suites stay green: the search route behaves
      identically after the pagination extraction (unit + supertest + the 5
      Playwright specs).

**When ready:**

The backend serves the complete favorites API from the plain-object in-memory
storage, shares one pagination module with the search route, and every suite
— new and pre-existing — is green with the frontend untouched.

**Acceptance Criteria:**

- [x] Favorites are stored on the backend in a plain in-memory object
      (`const favorite = {}`) keyed by show id, holding full show snapshots;
      no database or file persistence is involved; a server restart clears
      the storage (observed manually).
- [x] `POST /api/favorites`, `DELETE /api/favorites/:id`,
      `GET /api/favorites/count` and `GET /api/favorites?page=` behave per
      the shapes above; the list serves 3 shows per page with clamped page
      metadata.
- [x] Serving favorites never calls TVmaze.
- [x] The route follows the documented backend organization: own folder +
      barrel, mounted in `app.ts`, `~` alias imports, and the pagination
      helpers shared with the search route live in a single module (no
      duplication).
- [x] The backend favorites behavior is covered by the colocated unit suite
      and the app-level supertest suite; `npm run typecheck`,
      `npm run lint` and `npm run test` pass and `npm run test:e2e` is
      unaffected.

### Phase 2: Frontend favorites infrastructure (additive)

**Goal:** The frontend layers the migration will consume exist and are
proven in isolation: `web/src/api/favorites.ts` over an extended request
layer (POST/DELETE + JSON body), the favorites Entity extended with
backend-synced state (ids/count/list) alongside the legacy state, and the
two read-side Tasks (summary sync, favorites page fetch). The running app is
unchanged — it still uses the client-side favorites.

**Affects:** frontend

**Tasks:**

- [x] Write this phase's tests first (see Tests): extend
      `web/src/api/tests/` and `web/src/store/favorites/tests/`, and add the
      new Task suites in `web/src/pages/tasks/tests/` — red before the
      implementation exists.
- [x] Extend `web/src/api/request.ts` with HTTP-method + JSON-body support
      (existing GET callers and the `ApiError`/`AbortError` semantics stay
      unchanged) and add `web/src/api/favorites.ts`:
      `addFavoriteShow(show)`, `removeFavoriteShow(id)`,
      `fetchFavoritesCount()`, `fetchFavoritesListPage(page)`. Declare
      `FavoritesSummary` (`{ count, ids }`) and `FavoritesListPage`
      (`{ shows, page, pageCount, totalCount }`) in `web/src/api/types.ts`.
- [x] Extend the favorites Entity additively: the state gains
      `ids: number[]`, `count: number` and `list: FavoritesListPage | null`
      (the legacy `shows` field stays until Phase 3); reducers
      `replaceFavoritesSummary` and `replaceFavoritesList`; selectors
      `selectFavoriteIds`, `selectFavoritesCount`, `selectFavoritesList`;
      the Entity `types.ts` and both barrels (`store/favorites/index.ts`,
      `store/index.ts`) publish the additions. Adjust the entity suite's
      exact-shape initial-state assertion to the extended shape.
- [x] Add the read-side Tasks to `web/src/pages/tasks/` (the nearest common
      ancestor of both consuming pages — the same placement as the existing
      toggle Task): `syncFavoritesSummary.ts` (fetch count -> dispatch
      `replaceFavoritesSummary`) and `fetchFavoritesPage.ts` (fetch a list
      page -> dispatch `replaceFavoritesList`). Plain async functions,
      explicit arguments, HTTP only through `@api/favorites`, state only via
      `store.dispatch`, success/error results returned to the caller.
- [x] Sync the README `web/` tree with the new API module and Task files.
- [x] Verify: `npm run typecheck`, `npm run lint` and `npm run test` green;
      `npm run test:e2e` unaffected; manual dev-pair round showing the app
      behaves exactly as before (nothing consumes the new layers yet).

**Tests:**

- [x] API unit tests (mocked `fetch`, red -> green): add sends
      `POST /api/favorites` with the JSON show body and content-type header;
      remove sends `DELETE /api/favorites/:id`; count and list send GETs
      (list with the `page` param); each returns the parsed envelope; a
      non-OK response produces the normalized `ApiError`; the existing
      `searchShowsPage` assertions stay unchanged.
- [x] Entity unit tests (red -> green): both reducers store their payload
      verbatim; the selectors return ids, count and list; the extended
      initial state.
- [x] Task unit tests (`vi.mock` at the `@api/favorites` boundary, red ->
      green): success dispatches the corresponding reducer with the API
      payload and returns a success result; an API failure dispatches
      nothing and returns an error result; the suites import the task
      modules without React, proving the plain-function interface.
- [x] All pre-existing suites stay green (only the single initial-state
      assertion is adjusted).

**When ready:**

The API module, the extended Entity and the read-side Tasks exist with green
unit proofs and no consumers — the running app and every pre-existing suite
are unchanged.

**Acceptance Criteria:**

- [x] `web/src/api/favorites.ts` is the only place holding favorites HTTP
      details; consumers use only its function interface.
- [x] The favorites Entity exposes the backend-synced state (ids, count,
      list) through reducers and selectors and contains no
      presentation/UI-related state.
- [x] The read-side Tasks follow the documented Task rules: plain
      functions, explicit arguments, HTTP only through the API layer, store
      updates only via `store.dispatch`, results returned to the caller.
- [x] The new behavior is covered by automated tests in the colocated
      `tests/` folders; `npm run typecheck`, `npm run lint` and
      `npm run test` pass with the app behavior unchanged.

### Phase 3: Migration — backend-driven hearts and paginated FavoritesPage

**Goal:** The atomic switch making the backend the single source of truth:
the toggle Task calls the API and stores the returned summary, hearts on
both pages read the backend ids, the HomePage syncs the summary on mount,
the FavoritesPage renders the backend's paginated list (3 per page) with
pagination controls and an always-visible back button, and the legacy
client-side favorites storage is deleted. E2E proves the migrated flow end
to end.

**Affects:** frontend

**Tasks:**

- [x] Write `e2e/favorites.spec.js` first (red; every later favorites E2E
      extension joins this single file): it clears any warm favorites
      through the backend API (request context) for a deterministic start,
      then searches `space` (recorded deviation: the spec got its own stub
      fixture queries `space`/`edge` — searching `world` in parallel with
      browse.spec raced the shared TVmaze cache and broke its upstream-hit
      delta assertion), hearts a show and asserts the pressed heart
      state survives a genre change, a page change and a new search;
      favorites four shows, reaches `/favorites` through the existing nav
      link (the count button arrives in Phase 5) and asserts 3-per-page
      listing with `Page 1 of 2` and working Next/Prev; removes one show on
      the page and asserts the list and pagination metadata update; clicks
      the back button and lands on the HomePage.
- [x] Move `Pagination` (with its `ArrowButton` and `logic/`) from
      `HomePage/ShowSearchResults/` to `web/src/pages/components/` — it is
      now shared by two pages, so the nearest-common-ancestor rule applies
      (the same folder as `FavoriteButton`); update the imports; the
      HomePage suites stay green untouched.
- [x] Rewrite `toggleShowFavorite` in `web/src/pages/tasks/` as the async
      backend Task: it calls `addFavoriteShow`/`removeFavoriteShow` with the
      explicit `(show, isFavorite)` arguments, dispatches
      `replaceFavoritesSummary` from the response on success, and returns a
      success/error result (the Phase 4 toasts consume it); rewrite its
      suite against the mocked API boundary.
- [x] Rewire the HomePage: `useShowFavorites` derives `isFavorite` from
      `selectFavoriteIds` and invokes the rewritten Task; the page presenter
      runs `syncFavoritesSummary` on mount; update
      `favoritesFlow.test.tsx` (mock `@api/favorites`; heart states follow
      the dispatched summary, a failed toggle dispatches nothing) and extend
      the shared `test/home-flow.tsx` helper with the `@api/favorites` mock
      (recorded deviation: `vi.mock` does not hoist inside helper modules —
      registering it there double-mocks and splits the mock instances — so
      the mock is declared in the suite itself and the helper carries a
      comment documenting why).
- [x] Rewire the FavoritesPage: the presenter fetches the list page on
      mount and on page selection through `fetchFavoritesPage`, reads the
      envelope through `selectFavoritesList`, renders `Pagination` from its
      new location, removes through the rewritten toggle Task and refetches
      the current page afterwards (the backend clamps the envelope when the
      page shrank), and gains a back-to-Home button in the page head
      visible in both the empty and non-empty states (the existing
      empty-state "Browse shows" action stays); rewrite
      `FavoritesPage.test.tsx` accordingly, keeping the empty-state
      assertion.
- [x] Delete the legacy client-side storage: the Entity's `shows` field, the
      `addFavorite`/`removeFavorite` reducers, the `selectFavoriteShows`
      selector, their barrel exports and their suite cases; grep proves no
      references remain anywhere in `web/src`.
- [x] Verify: `npm run typecheck`, `npm run lint`, `npm run test`,
      `npm run test:e2e` (including the new spec) and `npm run build` green;
      manual dev-pair round through both pages' toggle/list/remove flows,
      including a backend restart clearing the favorites.

**Tests:**

- [x] The new E2E spec above (red -> green), self-contained in
      `favorites.spec.js` for worker safety; the pre-existing specs (4, the
      plan miscounted 5) stay green untouched.
- [x] Rewritten unit/integration suites (red -> green): the toggle Task
      (POST/DELETE with the correct arguments, summary dispatched on
      success, nothing dispatched on failure, results returned), the
      HomePage favorites flow (hearts from ids, summary sync on mount), the
      FavoritesPage (list fetch on mount and page change, pagination
      rendering, removal updates the list, back button navigates, empty
      state preserved).
- [x] Entity suites cover only the backend-synced state; the deleted legacy
      actions are gone (compiler + grep proof).

**When ready:**

Every favorites read and write goes through the backend, the legacy
client-side storage is deleted, the FavoritesPage paginates 3 per page with
a back button, and the complete suite including the new E2E spec is green.

**Acceptance Criteria:**

- [x] Clicking the heart on a non-favorite/favorite show issues
      `POST /api/favorites` / `DELETE /api/favorites/:id`, after which the
      backend storage contains/no longer contains the show (E2E + Task
      suites).
- [x] The heart state of every rendered show comes from the backend
      favorite ids and survives a new search, a genre change and a page
      change within the session.
- [x] No authoritative client-side favorites storage remains (legacy
      reducers/selectors deleted); the Entity holds only backend-provided
      data.
- [x] The FavoritesPage lists favorites 3 per page from the backend with
      pagination controls reflecting the total count; a removal updates the
      list and pagination; the empty state is preserved; a back button to
      the HomePage is visible in every state.
- [x] `npm run typecheck`, `npm run lint`, `npm run test`,
      `npm run test:e2e` and `npm run build` pass.

### Phase 4: Toast notifications

> **Superseded in part by Phase 7:** the hand-rolled
> `pages/components/Toast/` component built in this phase was replaced by
> the Sonner-backed global toaster; the user-visible behavior recorded
> here (distinct messages, bottom-centred placement, 3000 ms auto-dismiss,
> silent failures) is unchanged.

**Goal:** A successful add or removal shows a distinct, automatically
disappearing toast on both pages; failed operations never toast. The Toast
component joins `pages/components/` (shared by two pages); the page
presenters own the toast state driven by the toggle Task's results.

**Affects:** frontend

**Tasks:**

- [x] Extend `e2e/favorites.spec.js` first (red): after a heart add the
      addition toast is visible; after a heart removal on the HomePage and
      on the FavoritesPage the distinct removal toast is visible; each toast
      disappears without any user interaction (assert hidden after waiting
      past the display duration).
- [x] Create `web/src/pages/components/Toast/` (nearest common ancestor of
      the two consuming pages): the presentational View (message and
      `onDismiss` via props, `role="status"` live region) styled with a CSS
      Module using existing tokens; the auto-dismiss timer lives in the
      component's own presenter (`logic/useToast.ts`) calling `onDismiss`
      after a `TOAST_DURATION_MS` constant — the exact duration and
      placement are a recorded design decision (the PRD leaves them to the
      design); regenerate the CSS Module types.
- [x] Wire the HomePage presenter: toast state set from the rewritten toggle
      Task's success result (distinct add vs. remove messages), cleared on
      dismiss; the View renders `<Toast />` while a message is active; a
      failed toggle shows nothing.
- [x] Wire the FavoritesPage presenter the same way for the removals
      performed there.
- [x] Unit tests: the Toast component suite (fake timers — renders the
      message, calls `onDismiss` after the duration) and page-suite
      extensions at the mocked API boundary (successful add shows the
      addition message, successful removal shows the removal message,
      failure shows no toast).
- [x] Record the deferred design-canvas mirroring of the toast (pen.dev
      tooling currently blocked); verify `npm run typecheck`,
      `npm run lint`, `npm run test` and `npm run test:e2e` green plus a
      manual dev-pair round.

**Tests:**

- [x] Toast component suite with fake timers (red -> green).
- [x] Page-suite toast assertions for both pages, including the
      failure-shows-nothing case (red -> green).
- [x] E2E toast assertions including the auto-dismiss without interaction
      (red -> green); all other specs unaffected.

**When ready:**

Every successful favorite add/removal on either page is confirmed by a
distinct auto-dismissing toast, failures stay silent, and the complete suite
is green.

**Acceptance Criteria:**

- [x] A successful add shows a toast confirming the addition; a successful
      removal shows a toast with a distinct message confirming the removal —
      on the HomePage and on the FavoritesPage.
- [x] Toasts disappear automatically without user interaction.
- [x] A failed favorite operation shows no toast.
- [x] The Toast component follows the organization and styling rules
      (`pages/components/` placement, presentational View, CSS Module +
      design tokens, barrel exporting the View only) and is covered by unit
      tests; the toast flows are covered by E2E.
- [x] `npm run typecheck`, `npm run lint`, `npm run test` and
      `npm run test:e2e` pass.

**Phase 4 execution notes (recorded decisions and deviations):**

- Design decisions (canvas mirroring deferred — the pen.dev MCP tools are
  still plan-usage-limited, confirmed during this phase; the `.pen` file
  was not touched): `TOAST_DURATION_MS = 3000`; the toast renders as a
  fixed, bottom-centred pill (`--surface-2` background, `--accent-border`,
  `--radius-pill`, `--shadow-card`, heart icon in `--favorite`); messages
  `Added to favorites` / `Removed from favorites`.
- The shared message strings live in `web/src/pages/constants.ts`
  (`TOAST_MESSAGES`) and the shared toast-state shape in
  `web/src/pages/types.ts` (`PageToast = { id, message }`) — both at the
  two consuming pages' nearest common ancestor. Presenters keep
  `{ id, message } | null` state and the Views key the component with the
  `id`, so every successful operation remounts the Toast and re-arms its
  auto-dismiss timer even for a repeated identical message.
- `useToast` deliberately depends only on `onDismiss` (a `setTimeout`
  armed on mount, cancelled on unmount); the re-key remount, not a message
  dependency, is what re-arms the timer.
- Deviation (120-line `max-lines` budget): the favorites E2E helper
  functions were extracted into `e2e/favorites-helpers.js` (pure locators
  and API probes; the toast test also uses `shownToast`/`hiddenToast`
  probes there) — all favorites _tests_ remain in the single
  `favorites.spec.js`, preserving the sequential-mutation design. The
  Phase 3 specs keep every original assertion; only their repeated opening
  became the shared `searchSpace` helper, adjacent comment lines merged
  and the file kept <= 120 lines.
- Deviation (same budget): the toast flow suites were added as sibling
  files `web/src/pages/HomePage/tests/favoritesToastFlow.test.tsx` and
  `web/src/pages/FavoritesPage/tests/favoritesToast.test.tsx` instead of
  growing the Phase 3 suites past 120 lines; those committed suites stay
  byte-identical.
- Verification performed: the new E2E toast spec was written first and ran
  red; after implementation — `npm run typecheck`, `npm run lint` (no
  warnings; the repo's max-lines budget is honoured by every new/changed
  source file), `npm run test` (web 20 files/79 tests, server 8/45) and
  `npm run test:e2e` (8 passed) are green. The manual round: the Playwright
  webServer pair boots the real `npm run dev` + backend, and the four
  favorites endpoints were additionally exercised by hand against a running
  backend (add -> `{count, ids}`, re-add deduped, count, list envelope
  `page=1/1 total=1`, delete -> updated summary, invalid body -> 400).

### Phase 5: Favorites count button on the HomePage

**Goal:** The HomePage displays a button with the current number of favorite
shows that navigates to `/favorites` on click; the count stays current from
the backend-synced Entity after every add/remove on either page.

**Affects:** frontend

**Tasks:**

- [x] Extend `e2e/favorites.spec.js` first (red): the count button is
      visible on the HomePage showing the current count; a heart add
      increments it; a removal on the FavoritesPage is reflected after
      returning Home; clicking the button lands on the Favorites page.
- [x] Create `FavoritesCountButton` inside `web/src/pages/HomePage/`
      (exclusive-owner rule — only the HomePage uses it): a presentational
      View (count + `onClick` props, heart icon, accessible name) with a
      CSS Module using existing tokens; regenerate the CSS Module types.
- [x] Wire the HomePage presenter and View: the count comes from
      `selectFavoritesCount`, the navigation happens through
      `navigate('/favorites')` at the Presenter level (the View never
      touches the router); the button renders in the hero section — the
      final placement is a recorded design decision, with the canvas
      mirroring deferred while the pen.dev tooling is blocked.
- [x] Update the shared `test/home-flow.tsx` helper to wrap `HomePage` in a
      `MemoryRouter` (its presenter now navigates), keeping every
      helper-driven suite green.
- [x] Unit tests (red -> green): the button renders the count from the
      store and updates after a summary dispatch; the click navigates to
      the favorites route (route-stub assertion); grep proves the View
      imports neither the router nor the store.
- [x] Sync the README `web/` tree with the frontend structure accumulated
      by this feature (`pages/components/Pagination`,
      `FavoritesCountButton`, the favorites Tasks — the `App/` component
      directory, the `notification/` module and the removed `Toast`
      component were already synced in Phase 7); verify
      `npm run typecheck`, `npm run lint`, `npm run test`,
      `npm run test:e2e` and `npm run build` green plus a manual round.

**Tests:**

- [x] Component/presenter suites as listed above (red -> green).
- [x] E2E count, cross-page freshness and navigation assertions (red ->
      green).
- [x] All pre-existing suites green with the router-aware test helper.

**When ready:**

The HomePage shows the live favorites count in a button that navigates to
the Favorites page, proven by unit suites and E2E, with the global nav
unchanged.

**Acceptance Criteria:**

- [x] The HomePage displays a button showing the current number of favorite
      shows; the count updates after every add and remove, including
      removals performed on the FavoritesPage.
- [x] Clicking the button navigates to the Favorites page; the navigation
      is presenter-driven and the View never touches the router.
- [x] The count is the backend-computed value read from the Entity — no
      client-side authoritative counting.
- [x] The existing global navigation stays unchanged.
- [x] The button is covered by unit tests and the E2E spec;
      `npm run typecheck`, `npm run lint`, `npm run test` and
      `npm run test:e2e` pass.

**Phase 5 execution notes (recorded decisions and deviations):**

- Design decisions (canvas mirroring deferred — the pen.dev MCP tools
  remain plan-usage-limited; the `.pen` file was not touched): the button
  renders in the hero directly below the search field as an accent-soft
  pill (`--accent-border`, `--radius-pill`, filled heart in `--favorite`,
  `--font-body`) showing the count and the word "favorites"; its accessible
  name is `View favorites (${count})`, so the count is part of the role
  name and both the unit and E2E suites assert exact counts.
- The count and navigation logic lives in
  `HomePage/logic/useShowFavorites.ts` (the presenter's favorites aspect)
  rather than in a new hook: `selectFavoritesCount` + `useNavigate`, with
  `navigate('/favorites')` inside a `useCallback`. Keeping it there holds
  `useHomePage.ts` at 116 lines, inside the 120-line budget.
- `renderHomePage` in `web/src/test/home-flow.tsx` now wraps the page in a
  `MemoryRouter` (the presenter navigates); the count suite renders its own
  `/favorites` route stub to assert the navigation without depending on the
  app shell.
- E2E deviation (line budget): the count assertions extend the two existing
  favorites tests instead of adding a fourth test, preserving the
  single-spec sequential-mutation design and the 120-line budget. The count
  button replaces the nav-link click in the pagination test (proving the
  URL change); the global nav link stays covered by the toast test.
- Environment note: the first E2E run reused externally started
  `npm run dev`/`npm run server` processes whose backend used the real
  TVmaze base URL, so every fixture spec failed; restarting the dev pair
  through the Playwright webServers (the Phase 7 note's remedy) fixed the
  run.
- Verification performed: the unit suite was written first and ran red (no
  button rendered); the E2E count assertions also ran red with the
  implementation stashed. After implementation — `npm run css-types`,
  `npm run typecheck`, `npm run lint` (0 errors, 0 warnings),
  `npm run test` (web 21 files/80 tests, server 8/45),
  `npm run test:e2e` (8 passed) and `npm run build` are green. Grep proves
  the View imports neither the router nor the store. The manual dev-pair
  round is covered by the Playwright webServers: the real `npm run dev` and
  backend served the add, cross-page removal and count-button navigation
  flows end to end.

### Phase 6: HomePage search-state restoration

**Goal:** Returning to the HomePage within the app session — through the
FavoritesPage back button or the global nav link — restores the search input
text, the selected genre, the active page and the corresponding results
page; a fresh app start behaves exactly as today. This completes the PRD;
the phase closes with a re-check of every PRD acceptance criterion.

**Affects:** frontend

**Tasks:**

- [ ] Extend `e2e/favorites.spec.js` first (red): search `world`, select
      the `Drama` genre, switch to page 2, go to the Favorites page through
      the count button, click the back button and assert the input value
      `world`, the pressed `Drama` chip, `Page 2 of 2` and the same Drama
      page-2 cards as before leaving; a second flow reaches the Home
      through the global nav link and restores identically.
- [ ] Choose and record the persistence seam for the search session (the
      last submitted query + the genre/page selection): candidates are a
      Redux search-session slice (application data, written through a small
      Task per the dispatch rules), URL query parameters (Presenter-driven
      through the Router) or a module-scoped session object. Whichever is
      chosen must survive the HomePage unmount within the session, keep the
      presentation status presenter-owned, and comply with the Simple
      Architecture rules; persistence across a browser reload is not
      required (PRD out of scope).
- [ ] Seed the HomePage presenter on mount from the persisted session:
      restore the snapshot (`SUCCESS` status, `queryEcho`, selection) and
      the request coordination (`requestRef`) so the search field's
      `isCurrentQuery` dedup recognises the restored query and the stored
      shows-Entity result renders without the new-search genre/page reset;
      if no corresponding stored result exists, re-issue the persisted
      request through the existing `fetchShowsPage` Task (the backend cache
      keeps it cheap).
- [ ] Give the search field a presenter-provided initial-text seam (e.g. an
      `initialQuery` prop consumed by `useShowsSearchField`'s state
      initializer) so the restored query renders in the input without
      re-triggering a submission or a debounce cycle.
- [ ] Unit tests (red -> green): a remount-restoration suite (search ->
      genre -> page -> unmount -> re-render asserts input text, chip state,
      page info and rendered cards) and a fresh-start suite (no persisted
      session -> IDLE results and an empty input, exactly as today); the
      existing debounce/flow suites stay green.
- [ ] Verify: `npm run typecheck`, `npm run lint`, `npm run test`,
      `npm run test:e2e` and `npm run build` green; manual dev-pair round
      through the full PRD user-scenario list, then re-check every PRD
      acceptance criterion against the finished feature.

**Tests:**

- [ ] The E2E restoration flows above (red -> green), inside
      `favorites.spec.js`.
- [ ] Remount-restoration and fresh-start unit suites (red -> green).
- [ ] All pre-existing suites (search flow, debounce, favorites, toasts,
      count button) stay green.

**When ready:**

Leaving and returning to the HomePage within a session restores the search
query, genre filter, active page and results; a fresh start is unchanged;
the complete automated suite is green and every PRD acceptance criterion is
re-verified.

**Acceptance Criteria:**

- [ ] After leaving the HomePage with a search query, a genre filter and a
      page number set, returning from the Favorites page through the back
      button or the nav link within the same app session shows the restored
      search input text, the selected genre, the active page and the
      corresponding results page.
- [ ] Restoration never applies the new-search reset (genre and page
      survive the round trip).
- [ ] A fresh app start without a persisted session behaves exactly as
      today: empty input, IDLE results.
- [ ] The persisted session is scoped to the app session per the recorded
      seam decision; browser-reload persistence remains out of scope.
- [ ] The restoration flows are covered by unit tests and E2E;
      `npm run typecheck`, `npm run lint`, `npm run test`,
      `npm run test:e2e` and `npm run build` pass.

### Phase 7: Sonner toast integration (replaces the Phase 4 Toast component)

> Executed directly after Phase 4, before Phases 5–6. A tooling decision
> adopts the `sonner` library as the app-wide toast system, so the
> hand-rolled `pages/components/Toast/` component and the per-page toast
> state are removed and every toast flows through one library-independent
> notification API. The Phase 4 user-visible behavior is preserved.

**Goal:** The app owns a single global toast outlet and a centralized,
library-independent notification API (`success`, `error`, `info`,
`warning`, `loading`, `promise`) backed by Sonner; the favorites
confirmations migrate to it with unchanged behavior — distinct add/remove
messages, bottom-centred placement, 3000 ms auto-dismiss, failures silent.

**Affects:** frontend

**Tasks:**

- [x] Install `sonner` in the `web/` workspace (npm workspaces).
- [x] Move the App shell into its own component directory
      (`web/src/App/`: `App.tsx`, `App.module.css`, its generated
      declaration and an `index.ts` exporting the App View only — the App
      becomes a named export, `main.tsx` imports the directory) and
      extract the notification API into its own top-level module
      `web/src/notification/`, the home of the sending API: `notify.ts`
      (the wrapper), `types.ts` (`NotifyAction`, `NotifyOptions`,
      `NotifyPromiseMessages<T>` — consumers never touch a Sonner type),
      the module `index.ts` publishing `notify` + types, and the
      delegation suite. The rendering outlet stays with its owner as the
      App child component `web/src/App/Toaster/` (View + styles + the
      inlined `NOTIFY_DURATION_MS = 3000`), rendered once in the App View
      and published through its View-only directory barrel.
- [x] Declare the `@notification` alias (pointing at `src/notification`)
      in all four declaring configs (`web/vite.config.ts`,
      `web/vitest.config.ts`, `eslint.config.js`,
      `web/tsconfig.app.json`) and in the coding-conventions alias table.
- [x] Migrate both pages: the presenters call `notify.success(...)` on
      the toggle Task's success result; the per-page `PageToast` state,
      the `dismissToast` handlers and the `<Toast />` rendering are
      removed from both Views; delete `pages/components/Toast/` and
      `pages/types.ts`; `TOAST_MESSAGES` in `pages/constants.ts` stays
      the shared message source.
- [x] Rewrite the two page toast suites against the mocked
      `@notification` boundary; add the wrapper delegation suite in
      `notification/tests/` (Sonner mocked); delete the Toast component
      suite; update the E2E probes to Sonner's `[data-sonner-toast]`
      markup, filtered by the expected message.
- [x] Sync the docs: README `web/` tree (`App/` component directory and
      the top-level `notification/` module) and the AGENTS.md stack table
      (`Toasts | sonner`).
- [x] Verify: `npm run css-types`, `npm run typecheck`, `npm run lint`,
      `npm run test`, `npm run test:e2e` and `npm run build` green plus a
      manual dev-pair round of both pages' toast flows.

**Tests:**

- [x] `notify` delegation suite (red -> green): every message type
      forwards the message and options to the matching Sonner call;
      `promise` forwards the promise and its lifecycle messages.
- [x] Page suites at the mocked `@notification` boundary (red -> green):
      a successful add/removal calls `notify.success` with the distinct
      `TOAST_MESSAGES` string; a failed toggle calls nothing.
- [x] E2E toast assertions unchanged in intent (message visible,
      auto-dismiss without interaction) through the message-filtered
      probes; all other specs green.

**When ready:**

Every toast in the app is rendered by the one global Sonner outlet and
triggered through the library-independent `notify` API; the favorites
confirmations behave exactly as in Phase 4; the complete suite is green.

**Acceptance Criteria:**

- [x] Exactly one global `<Toaster />` instance, mounted at App level;
      Sonner is imported only inside the toast facility
      (`web/src/notification/` and `web/src/App/Toaster/`) — grep proof.
- [x] `notify` exposes `success`, `error`, `info`, `warning`, `loading`
      and `promise` with typed, library-independent signatures (no
      `any`); toasts are triggered at Presenter level only — Tasks and
      Views never touch the notification API.
- [x] The favorites confirmations keep the Phase 4 behavior: distinct
      messages from `TOAST_MESSAGES`, 3000 ms auto-dismiss, bottom-centred
      placement, token-based styling, silent failures.
- [x] The hand-rolled Toast component, the `PageToast` type and the
      per-page toast state are deleted with no remaining references
      (grep proof).
- [x] `npm run typecheck`, `npm run lint`, `npm run test`,
      `npm run test:e2e` and `npm run build` pass.

**Phase 7 execution notes (recorded decisions and deviations):**

- Design decisions (canvas mirroring still deferred — the pen.dev MCP
  tools remain plan-usage-limited; the `.pen` file was not touched): the
  Toaster keeps the recorded placement (`position="bottom-center"`) and
  duration (3000 ms) and uses `theme="dark"` to match the app palette;
  the toast skin redefines the Sonner CSS variables on the toast element
  through a CSS Module class (`toastOptions.className`): `--normal-bg:
var(--surface-2)`, `--normal-text: var(--text-primary)`,
  `--normal-border: var(--accent-border)`, `--border-radius:
var(--radius-pill)`, plus `font-family: var(--font-body)` — variable
  redefinition on the element itself beats Sonner's runtime-injected
  stylesheet without specificity fights. The Phase 4 heart icon is
  replaced by Sonner's built-in per-type status icons (a generic notify
  API must not hardcode a favorites-specific icon); Sonner's toaster
  z-index keeps toasts above every app surface.
- Structure (component-organization compliance): the App shell became a
  proper component directory — `src/App/` with `App.tsx`, its styles, an
  `index.ts` exporting the View only and a named `App` export — and the
  toast facility is split by ownership: the sending API lives in the
  top-level `src/notification/` module (`notify` + types + delegation
  suite; pages consume it through the `@notification` alias), while the
  rendering outlet is the App-owned `src/App/Toaster/` component (View +
  styles + duration, View-only barrel) rendered once by the App View.
- The wrapper returns `void` (no toast-id plumbing) — nothing in the app
  updates or dismisses toasts imperatively yet; `NotifyOptions` covers
  `id`, `duration` and an `action` (e.g. Undo) for future use.
- Deviation (behavior, by design): Sonner toasts are global — they stack
  and survive SPA navigation, unlike the per-page single-slot Phase 4
  Toast that unmounted with its page. The E2E toast probes therefore
  filter `[data-sonner-toast]` by the expected message instead of
  matching the single `role="status"` element (Sonner exposes the toaster
  outlet, not each toast, as the aria-live region).
- Deviation (tests): the Phase 4 auto-dismiss unit assertions (fake
  timers on the Toast presenter) are gone with the component — dismissal
  is Sonner's own behavior now, asserted only in E2E (`hiddenToast`
  probes). The suite counts move from web 20 files/79 tests to 20/77.
- Deviation (120-line budget): adding the alias entry pushed
  `eslint.config.js` to 121 lines; the two-line `globalIgnores` minimatch
  comment was condensed to one line to restore the budget (no code
  change).
- Deviation (environment): `reuseExistingServer` kept a Vite dev server
  that predated the sonner install, so its stale dep cache served blank
  pages and 7 E2E specs failed; killing the stray servers and clearing
  `node_modules/.vite` fixed the run — a fresh machine or a restarted dev
  server is required after adding a dependency.
- Verification performed: the rewritten toast suites and the notify
  delegation suite were written before the implementation (red); after
  implementation — `npm run css-types` (Toaster declaration generated),
  `npm run typecheck`, `npm run lint` (0 errors, 0 warnings),
  `npm run test` (web 20 files/77 tests, server 8/45),
  `npm run test:e2e` (8 passed, including the message-filtered toast
  lifecycle spec) and `npm run build` are all green. The App/Toaster
  relocation and the later `notification/` extraction were re-verified
  with the same commands — typecheck, lint (0 warnings), test (web 20
  files/77 tests, server 8/45), E2E (8 passed) and build all green.
