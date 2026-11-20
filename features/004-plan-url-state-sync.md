# Plan: URL State Synchronization

**PRD:** features/004-prd-url-state-sync.md

**Date:** 2026-11-20

> **Approach.** The feature is frontend-only — the PRD explicitly excludes
> backend changes, and both routes (`/`, `/favorites`) already exist under
> React Router 7. Phase 1 is the tracer bullet: the complete HomePage
> mechanism (URL codec -> presenter reads/writes -> URL-driven requests
> through the existing Task/Entity layers), keeping the Redux `searchSession`
> only as a transitional mount fallback for parameter-less `/` so the
> existing Favorites round-trip restoration never regresses mid-plan.
> Phase 2 flips restoration fully onto the URL: the Favorites "Back to Home"
> button becomes history-preserving, and the `searchSession` slice with its
> Task and hooks is deleted. Phase 3 applies the same pattern to the
> Favorites page `page` parameter. Every phase leaves the app fully
> functional, so work can stop after any completed phase.
>
> **Testing.** Red -> green per AGENTS.md: each phase writes its automated
> tests before the implementation. HomePage URL sync is read-only against the
> backend, so its E2E lives in a new `e2e/url-sync.spec.js`; favorites E2E
> stays consolidated in `e2e/favorites.spec.js` (parallel Playwright workers
> share one backend with in-memory favorites — mutations must remain
> sequential in one file). Unit/component suites render inside
> `MemoryRouter` with `initialEntries` and assert the URL through a location
> probe; E2E asserts `page.url()` and `window.history.length` (replace vs
> push).
>
> **Key decisions (recorded):**
>
> - Parameters are omitted when they equal their defaults: no `search` when
>   empty (idle), no `genre` when "All genres", no `page` when 1 — consistent
>   with the PRD rule that a missing parameter means the default.
> - History: debounced search writes use `replace`; genre and page changes
>   use `push` (router `setSearchParams` options — never manual
>   `history.pushState`, per the PRD limitation).
> - "Unknown genre" is validated against the loaded envelope's `genres` list
>   (the only client-available genre list — `ALL_GENRES` plus envelope genres
>   is what `GenreFilter` renders): after a successful fetch, a URL `genre`
>   absent from the envelope is reset to the default with a replace write.
>   Backend page clamping stays unchanged; the URL is never rewritten to the
>   clamped page (explicit PRD rule).
> - A mount with a `search` parameter always fetches: the shows Entity holds
>   no request identity, and adding one would duplicate the synchronized
>   values in Redux, which the PRD forbids. The backend's 5-minute TVmaze
>   cache keeps in-session refetches cheap.
> - Global "Home" nav link = fresh idle `/` (user decision); restoration
>   happens only via history-preserving navigation — browser back and the
>   Favorites "Back to Home" button (`navigate(-1)` when in-app history
>   exists, else `/`). The existing `roundTripRestoresSearch` E2E helper is
>   reworked to assert exactly this.
> - The optimistic LOADING feedback while the debounce is pending is
>   preserved (presentation status may precede the URL write); the _applied_
>   values that drive requests remain URL-only.
> - `useHomePage.ts` sits at 114 of the 120 allowed lines — the URL read/
>   write logic is extracted into its own hook module under
>   `pages/HomePage/logic/` instead of growing the presenter past
>   `max-lines`.
>
> **Constraints carried through every phase:** source files <= 120 lines
> (ESLint `max-lines`), TypeScript strict (`noUncheckedIndexedAccess`,
> `verbatimModuleSyntax`, `erasableSyntaxOnly`), object shapes as `type`
> aliases in the owning `types.ts`, extensionless import specifiers,
> `index.ts` barrels publishing Views (and `utils/` their public helpers)
> only, Views never touching the router or store — `useSearchParams` lives
> exclusively in Presenters (architecture.md Router rule), Tasks stay plain
> functions with explicit arguments, navigation only at Presenter level.
> The React memoization rules in `rules/react-memoization.md` apply to every
> hook reworked here: no memoization by default; `useCallback`/`useMemo` only
> for a concrete referential-stability or cost reason, with complete
> dependency arrays. No visual changes: the pen.dev design canvas is
> untouched.

## Implementation Phases

### Phase 1: HomePage URL synchronization mechanism

**Goal:** The HomePage's applied search term, genre filter, and page number
live in the URL (`?search=&genre=&page=`) and drive rendering and `/api/search`
requests; typing stays a local `draftSearch` written to the URL after the
existing 800 ms debounce. Deep links, reloads, and back/forward navigation
restore the full view. The `searchSession` slice is untouched except that it
no longer seeds mounts whose URL carries parameters (transitional fallback for
parameter-less `/`, removed in Phase 2).

**Affects:** frontend

**Tasks:**

- [ ] Write this phase's E2E first (red): new `e2e/url-sync.spec.js` against
      the stub fixtures (`world` query, multi-page + genre-able): deep link
      `/?search=world&genre=Drama&page=2` renders input text, pressed genre
      chip, active page and the matching slice; typing updates the input
      immediately and the URL only after the debounce (assert `page.url()`
      before/after and `window.history.length` unchanged = replace); genre
      click sets `genre`, drops `page`, and grows history; next-page click
      sets `page`; back/forward restore state including input text; reload
      restores; `page=abc`, `page=0`, `genre=Horror` (not in envelope) fall
      back to defaults without crashing.
- [ ] Add the pure URL-state codec with unit tests: shared page-parameter
      primitives (`parsePageParam`: missing/non-numeric/sub-1 -> 1) in
      `web/src/pages/utils/url-params.ts` published through the existing
      `pages/utils` barrel (nearest common ancestor with the Favorites page,
      Phase 3 consumer); HomePage composition in
      `pages/HomePage/logic/urlState.ts` — parse `URLSearchParams` into
      `{ search, genre, page }` and serialize back omitting default-valued
      parameters.
- [ ] Extract the URL read/write hook (e.g. `logic/useUrlSearchState.ts`):
      wraps `useSearchParams`, exposes the parsed state plus
      `applySearch` (replace; resets `genre`/`page` by omission),
      `selectGenre` (push; `page` reset to 1), `selectPage` (push) — keeping
      `useHomePage.ts` within `max-lines`.
- [ ] Rework `useShowsSearchField` to the draft/applied split: local
      `draftSearch` state feeds the input; the debounce effect writes the
      trimmed value through `applySearch` (clear -> parameter removed ->
      idle); the input re-syncs from the URL `search` whenever it changes
      externally (mount, back/forward, programmatic clear); the optimistic
      LOADING report via `onSearchChange` while the debounce is pending is
      preserved; `initialQuery` plumbing is replaced by the URL value.
- [ ] Rework `useHomePage` onto URL state: `selection` derives from the
      parsed URL (not snapshot state); `selectGenre`/`selectPage` delegate to
      the URL hook; a single effect keyed on the parsed URL state runs the
      request through the existing `useShowsRequest` coordination
      (`toRequest`, dedupe against `requestRef` for identical values within
      the mount, Task-owned abort of superseded runs); mount with a `search`
      parameter always fetches; mount on parameter-less `/` keeps the
      existing `useRestoredSession` seeding unchanged (transitional).
- [ ] Add the post-fetch genre validation: after a successful run, a URL
      `genre` that is neither `ALL_GENRES` nor present in the stored
      envelope's `genres` is reset to the default with a replace write (one
      extra unfiltered fetch — the recorded decision for "unknown genre").
- [ ] Update the HomePage unit/component suites to the URL-driven behavior
      (render with `initialEntries`, assert through a location probe):
      `useShowsSearchField.test.ts` (draft/applied, debounce -> URL, external
      sync), `searchFlow`/`searchRendering`/`HomePage` suites (URL-driven
      fetch, selection handlers write the URL, reset semantics, invalid-value
      defaults, genre validation reset); `searchRestoration.test.tsx` stays
      green through the transitional fallback; turn the E2E spec green.

**Tests:**

- [ ] E2E `url-sync.spec.js` (red -> green): deep link, reload, debounced
      replace-write, genre/page push-writes with resets, back/forward
      restoration including input text, invalid-parameter defaults.
- [ ] Codec unit tests: parse/serialize round-trips, default omission,
      `page` fallbacks (missing/non-numeric/sub-1), trimmed search.
- [ ] Component/unit tests: input updates without URL change before the
      debounce; URL written (replace) after; clearing removes the parameter
      and idles the page; requests derive from URL values; displayed
      queryEcho/genre/page match the URL; unknown genre resets after fetch.
- [ ] Regression gate: the 5 pre-existing Playwright specs and all Vitest
      suites stay green (`browse.spec.js` and `favorites.spec.js` exercise
      genre/page/search flows that now write the URL).

**When ready:**

Every HomePage view state is expressible as a URL: loading any
`/?search=&genre=&page=` combination (typed, shared, reloaded, or reached via
back/forward) renders and fetches exactly what the URL describes; typing
remains debounce-gated with replace semantics; the only remaining session
dependence is the parameter-less `/` mount, documented as transitional.

**Acceptance Criteria:**

- [ ] The applied search term, selected genre, and current page appear in the
      HomePage URL as `search`, `genre`, `page` (defaults omitted).
- [ ] Typing updates the input immediately without changing the URL; after
      the debounce the URL `search` equals the trimmed value, written with
      replace semantics (no new history entry).
- [ ] Clearing the search field removes the `search` parameter after the
      debounce and the page shows its idle/empty state.
- [ ] Selecting a genre updates `genre` and resets `page` to 1; applying a
      new search term resets `genre` and `page`; genre/page changes push
      history entries and back/forward restore the state, including the
      search input text.
- [ ] Every `/api/search` request derives from the current URL parameter
      values, and the displayed results (query echo, genre selection, active
      page) match the URL.
- [ ] Loading a parameterized URL directly (new tab or reload) restores input
      text, genre, page, and fetches the corresponding results without user
      interaction.
- [ ] Missing/invalid parameters fall back to defaults without errors: empty
      `search` -> idle; unknown or missing `genre` -> "All genres" (unknown
      validated against the loaded envelope); non-numeric or sub-1 `page` ->
      page 1.
- [ ] `npm run typecheck`, `npm run lint`, `npm run test`, and
      `npm run test:e2e` pass.

### Phase 2: URL-based restoration and `searchSession` removal

**Goal:** The URL becomes the only restoration mechanism: the Favorites
"Back to Home" button returns to the parameter-preserving HomePage URL via
history, the global Home nav link opens a fresh `/`, and the Redux
`searchSession` slice with its Task, hooks, and helpers is deleted.

**Affects:** frontend

**Tasks:**

- [ ] Write this phase's E2E first (red): rework
      `roundTripRestoresSearch` in `e2e/favorites-helpers.js` — after
      `searchSpaceDramaPageTwo`, the count-button -> "Back to Home" round
      trip lands on a HomePage URL carrying `search`/`genre`/`page` and
      restores input text, chip, page, and results; the nav-link round trip
      (Favorites link -> Home link) now asserts the fresh idle HomePage
      (recorded decision); browser-back from `/favorites` likewise restores
      the parameterized URL.
- [ ] Change the FavoritesPage presenter's `goToHome` (used by both "Back to
      Home" and the empty-state "Browse shows" button): `navigate(-1)` when
      in-app history exists, else `navigate('/')`; the global nav `Link`s in
      `App.tsx` stay as-is (`/` = fresh start).
- [ ] Remove the transitional fallback and read side: delete
      `useRestoredSession.ts` and `useRestoredRequest.ts`, drop the
      `restoredSnapshot`/`sessionRequest` helpers from
      `logic/searchSession.ts` (keep `INITIAL_SELECTION`/`toRequest` or move
      them per component-organization rules); HomePage mounts seed from URL
      parameters only.
- [ ] Remove the write side: delete `logic/tasks/saveSearchSession.ts` and
      its call in `useShowsRequest.ts` (a successful run no longer persists
      anything beyond the shows Entity); delete the now-unused `sessionOf`
      helper.
- [ ] Delete the Entity slice: `web/src/store/searchSession/` (slice,
      selectors, types, barrel, tests), its wiring in `store/store.ts`, and
      the `replaceSearchSession`/`selectSearchSession`/`SearchSession`
      exports from `store/index.ts`; update `store.test.ts` root-state
      assertions and drop `searchSessionReducer` from the shows/favorites
      Entity test stores.
- [ ] Rework the restoration unit coverage to URL-based: rewrite
      `searchRestoration.test.tsx` (mount with `initialEntries` renders
      input/genre/page from the URL and fetches; remount with parameters
      restores); update the shared harness `web/src/test/home-flow.tsx` —
      drop the `replaceSearchSession(null)` reset and let
      `renderHomePage`/`remountHomePage` accept router `initialEntries`.
- [ ] Verify no stale references remain (`searchSession` grep across `web/`,
      `docs/`, `AGENTS.md`, `README` — docs carry none today) and run all
      gates green.

**Tests:**

- [ ] E2E (red -> green): back-button round trip preserves the parameterized
      HomePage URL and full state; nav-link Home opens fresh idle `/`;
      browser-back restoration; the rest of `favorites.spec.js` unchanged.
- [ ] Unit: URL-based restoration suite replaces the session-seeded one;
      store smoke suite passes without the `searchSession` key; Entity
      suites pass without the reducer; harness-driven flow suites stay green.
- [ ] Static check: no import, export, or type reference to `searchSession`
      remains anywhere in the workspace.

**When ready:**

`searchSession` no longer exists in the codebase; every restoration path
(reload, deep link, browser back, Favorites "Back to Home") runs exclusively
through URL parameters; the Home nav link yields a fresh idle HomePage.

**Acceptance Criteria:**

- [ ] After navigating to the Favorites page and returning via "Back to Home"
      or browser back, the search term, genre filter, page number, and
      corresponding results are preserved via the HomePage URL parameters.
- [ ] The Redux `searchSession` slice is removed from the store, and no other
      persisted client state determines the restored view on either route.
- [ ] The global Home nav link opens a fresh `/` (idle HomePage) — asserted
      in the reworked round-trip E2E.
- [ ] `npm run typecheck`, `npm run lint`, `npm run test`, and
      `npm run test:e2e` pass.

### Phase 3: Favorites page URL synchronization

**Goal:** The Favorites page list page lives in the URL (`/favorites?page=N`)
and drives the favorites-list requests: page changes push history, deep links
and reloads restore the page, invalid values default to page 1, and the
removal/refetch flow (with backend clamping) is URL-driven and otherwise
unchanged.

**Affects:** frontend

**Tasks:**

- [ ] Write this phase's E2E first (red): extend `e2e/favorites.spec.js`
      (mutations stay in this single file): seed 4 favorites via the UI,
      next-page click updates the URL to `?page=2` and renders page 2;
      back/forward walk the list pages; direct `goto('/favorites?page=2')`
      and reload show page 2; `?page=abc` and `?page=0` fall back to page 1;
      removing the last item of page 2 clamps to the served envelope
      (existing assertion, now reached through the URL page).
- [ ] Rework `useFavoritesPage` onto the URL: read the page through
      `useSearchParams` + the shared `parsePageParam` from `pages/utils`
      (Phase 1); the mount fetch uses the URL page instead of the hard-coded
      `1`; a single effect keyed on the URL page drives
      `fetchFavoritesPage(page)` (Task and Entity untouched).
- [ ] `selectPage` pushes the `page` parameter (omitted when 1) instead of
      calling the Task directly; the rendered list and pagination continue
      to come from the stored envelope (served page may be clamped — the URL
      is not rewritten, mirroring the HomePage rule).
- [ ] Keep the removal flow URL-based: after a successful
      `toggleShowFavorite`, refetch the current URL page; toast and
      summary-sync behavior unchanged.
- [ ] Update the FavoritesPage unit suites (`FavoritesPage.test.tsx`,
      `favoritesToast.test.tsx`) to render with `initialEntries` and a
      location probe: URL page drives the Task argument, page changes write
      the URL, invalid values fetch page 1.
- [ ] Run all gates green and confirm both routes' URL scenarios are covered
      end-to-end (PRD test-coverage criterion).

**Tests:**

- [ ] E2E (red -> green): favorites page parameter writes (push), deep link,
      reload, back/forward, invalid-value defaults, removal clamping via the
      URL page — inside `e2e/favorites.spec.js`.
- [ ] Unit: presenter fetches the URL page on mount and on change;
      `selectPage` writes the parameter; `parsePageParam` fallbacks applied;
      removal refetches the URL page.
- [ ] Regression gate: all pre-existing suites and the 6 Playwright specs
      pass.

**When ready:**

`/favorites?page=N` is linkable, reload-safe, and history-navigable; the
favorites list always corresponds to the URL page; every PRD acceptance
criterion on both routes is covered by automated tests and all gates pass.

**Acceptance Criteria:**

- [ ] The current favorites list page appears in the `/favorites` URL as the
      `page` query parameter; changing the page updates the parameter (push)
      and the displayed list matches the URL.
- [ ] Loading `/favorites?page=N` directly (new tab or reload) shows page N;
      a missing, non-numeric, or sub-1 `page` falls back to page 1 without
      errors.
- [ ] Favorites page changes push browser history entries, and the
      back/forward buttons restore the corresponding list page.
- [ ] Removing a show refetches the list based on the URL page, with the
      existing backend clamping behavior when the last page shrinks
      unchanged.
- [ ] The URL synchronization scenarios on both routes (deep link, reload,
      debounced search write, genre/page reset, defaults for invalid values,
      favorites page sync, back/forward navigation) are covered by automated
      tests.
- [ ] `npm run typecheck`, `npm run lint`, `npm run test`, and
      `npm run test:e2e` pass.
