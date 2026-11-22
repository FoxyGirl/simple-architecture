# Plan: Optimistic Favorites Toggle

**PRD:** features/006-prd-optimistic-favorites-toggle.md

**Date:** 2026-11-22

> **Approach.** The feature is frontend-only — the PRD forbids backend
> changes, and the existing endpoints (`POST /api/favorites`,
> `DELETE /api/favorites/:id`, both answering with the `{ count, ids }`
> summary) already carry everything the reconciliation needs. Phase 1 is the
> tracer bullet: the complete optimistic core on the HomePage — the toggle
> Task dispatches a transient pending overlay into the favorites Entity
> before the request, the heart and count selectors derive the effective
> state (backend ids ± pending), so the hearts and the count button flip on
> click, the confirmed summary reconciles them, and a failure rolls back
> structurally by clearing the pending entry. Phase 2 adds the
> disabled-while-pending heart button in both card layouts on both pages
> (the shared pending registry makes one wiring serve all consumers). Phase
> 3 makes the Favorites page soft-removal marking flip optimistically via
> the shared toggle hook's new start/failure callbacks. Every phase leaves
> the app fully functional, so work can stop after any completed phase.
>
> **Testing.** Red -> green per AGENTS.md: each phase writes its automated
> tests before the implementation. "Before the response arrives" is proven
> with delayed responses at both levels: unit suites use the existing mocked
> request boundary (`~/test/api-mock`) with deferred promises, and Playwright
> intercepts `**/api/favorites**` with `page.route` — `route.fetch()` for the
> real response, a delayed `route.fulfill`, and `route.abort()` for the
> failure scenarios. All favorites-mutating E2E stays in the single
> `favorites.spec.js` (parallel workers share one in-memory backend); the
> new scenarios join the flow-module pattern as `e2e/favorites-optimistic.js`.
> jsdom renders the mobile `ShowRowCard` (the setup mocks `matchMedia` to
> `false`) while the Playwright default viewport renders the desktop
> `ShowCard` — together they cover both required layouts; Phase 2 adds a
> viewport-resize probe for the disabled state on the row card.
>
> **Key decisions (recorded):**
>
> - **The optimistic/pending state lives in the favorites Entity as a
>   transient overlay, mutated only by the toggle Task** (decision deferred
>   to this plan by PRD 006; confirmed with the requester). The slice gains
>   a pending-toggles record (show id -> target favorite state) with
>   `beginFavoriteToggle` / `settleFavoriteToggle` actions. The backend-owned
>   `ids` stay verbatim (`replaceFavoritesSummary` unchanged); the overlay is
>   applied in the selectors with force semantics —
>   effective = (ids ∪ pending-adds) − pending-removes — so a summary
>   arriving from a concurrent toggle or a mount sync can never corrupt an
>   in-flight show's optimistic state. Rollback is structural: on failure the
>   Task clears the pending entry and the verbatim ids resurface. Rationale
>   vs. the "submitting state belongs to the Presenter" rule: this overlay is
>   consumed by three presenter trees at once (ShowList hearts, HomePage
>   count button, FavoritesPage disabled state); routing it through
>   presenters would require injecting it through
>   `ShowSearchResults` -> `ResultsFrame` -> `ShowList` or a second overlay
>   mechanism beside the soft-removal marking. The pending field is transient
>   operation state, never authoritative favorites data (the PRD 003 rule
>   "no authoritative favorites data on the client" is preserved), and the
>   Task stays the only Redux mutator.
> - The Favorites page removed marking stays presenter-owned view state
>   (feature 005 precedent): it flips on click through the shared hook's
>   optimistic callback and reverts through the new failure callback — it is
>   not moved into the Entity.
> - `useFavoriteToggle` keeps its toast semantics exactly: the success toast
>   appears only after the backend confirms, the error toast only on failure
>   (PRD requirement). Only the `onToggled` callback moves from
>   success-time to click-time, paired with a new `onToggleFailed(show,
wasFavorite)` rollback callback; the returned `boolean | null` contract
>   is unchanged. The Task direction (POST vs DELETE) is decided from the
>   pre-click state captured before the optimistic flip, so the flip can
>   never invert the request.
> - Disabled-while-pending is per show: the toggled show's heart is disabled
>   until its request settles; other hearts stay clickable (the PRD
>   constrains only the clicked button). `ShowList`'s public props contract
>   is unchanged — its presenter reads the new `selectPendingFavoriteIds`
>   selector directly, so both pages get the behavior through the shared
>   Entity registry without new injected props.
> - Consequence recorded: the Favorites page subhead reads the same
>   `selectFavoritesCount` as the HomePage count button, so it gains the same
>   optimistic behavior (updates on click, rolls back on failure). The PRD
>   scopes the optimistic count to the HomePage button but does not pin the
>   subhead; keeping one shared count source avoids a second verbatim-count
>   selector. List shows and pagination metadata remain fetch-time values
>   (feature 005 deferred refresh untouched).
> - The disabled heart visual is a design decision recorded in Phase 2:
>   native `disabled` + token-based styling (reduced opacity, `cursor:
not-allowed`, hover accent suppressed), mirroring the canvas through the
>   pen.dev MCP tools or recording it as a deferred follow-up if the
>   plan-usage limit noted in plans 003/005 still applies. The `.pen` file is
>   never touched outside the MCP design tools.
>
> **Constraints carried through every phase:** `server/` is untouched
> (grep/diff proof); source files <= 120 lines (ESLint `max-lines`, test
> files included — split suites/modules along the established seams if a
> rewrite would grow past the budget); TypeScript strict
> (`noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `erasableSyntaxOnly`);
> object shapes as `type` aliases in the owning `types.ts`; extensionless
> import specifiers; `index.ts` barrels publishing Views only; Views never
> touching the store or router; Tasks stay plain functions with explicit
> arguments and `store.dispatch` only; navigation and toasts at Presenter
> level only; CSS Modules with generated `.d.ts` (`npm run css-types` after
> every changed module) + `clsx` object form in base-then-modifier order +
> design tokens; the React memoization rules (`rules/react-memoization.md`)
> apply to every hook reworked here.

## Implementation Phases

### Phase 1: Optimistic toggle core (Entity overlay + HomePage)

**Goal:** On the HomePage, clicking a heart flips the heart state and the
favorites-count button immediately — before the backend responds. A
confirmed response reconciles the UI with the returned `{ count, ids }`
summary and shows the existing success toast; a failed response rolls the
heart and count back to their pre-click values with the existing error
toast. The Favorites page behavior is unchanged in this phase (its marking
still flips on success), and the backend is untouched. Tracer bullet: the
pending-overlay mechanism every later phase builds on.

**Affects:** frontend

**Tasks:**

- [x] Write the new E2E flow first (red): `e2e/favorites-optimistic.js`,
      registered in `favorites.spec.js` — HomePage scenarios using
      `page.route('**/api/favorites**')` interception: with a delayed
      `route.fulfill` of the real (`route.fetch()`) POST response, the heart
      label reads `Remove Space Tour from favorites` and `countButton(page,
1)` is visible before the fulfill resolves, and the add toast appears
      after; the same for DELETE (heart flips to `Add …`, count decrements
      before the response); with `route.abort()`, heart and count revert to
      their pre-click values, the error toast shows and no success toast
      appears. Extend `e2e/favorites-helpers.js` with a delayed-fulfillment
      route helper if needed; every touched file stays <= 120 lines.
- [x] Write the Entity and Task unit suites first (red):
      `favoritesEntity.test.ts` gains the pending-overlay cases —
      `beginFavoriteToggle` + effective `selectFavoriteIds`/
      `selectFavoritesCount` (add appears, remove disappears), force
      semantics against a concurrently replaced summary, `settleFavoriteToggle`
      restoring the verbatim ids on failure, and `selectPendingFavoriteIds`
      (consumed in Phase 2); `toggleShowFavorite.test.ts` asserts the
      dispatch sequence — pending begins before the request resolves,
      success dispatches summary + settle, failure dispatches settle only and
      still returns `{ status: 'error' }`.
- [x] Revise the HomePage unit suites first (red) at the mocked request
      boundary (`~/test/api-mock`, deferred promises):
      `favoritesToggle.test.tsx` and `favoritesToastFlow.test.tsx` — heart
      label and count button flip before the deferred POST/DELETE settles;
      the success toast appears only after the resolution; on rejection both
      revert and the error toast shows; `favoritesFlow.test.tsx` and
      `favoritesCountButton.test.tsx` are updated where they assert the
      update-after-response timing.
- [x] Implement the Entity overlay: `store/favorites/types.ts` gains the
      pending-toggles field (record of show id -> target favorite state) in
      `FavoritesState`; `favoritesSlice` gains `beginFavoriteToggle` and
      `settleFavoriteToggle` reducers (initial state: empty record);
      `replaceFavoritesSummary` keeps storing `ids` verbatim; the slice,
      `types.ts` and barrel doc comments are updated to describe the
      transient overlay beside the backend-synced mirror.
- [x] Implement the selectors: `selectFavoriteIds` returns the effective ids
      ((ids ∪ pending-adds) − pending-removes), `selectFavoritesCount` stays
      the length of the effective ids, new `selectPendingFavoriteIds`
      returns the in-flight ids; exported through the store barrels.
- [x] Implement the Task change in `toggleShowFavorite`: dispatch
      `beginFavoriteToggle(show.id, !isFavorite)` before the request; on
      success dispatch `replaceFavoritesSummary(summary)` then settle; on
      error settle before returning the error result. Update the JSDoc (the
      Task still never reads the store).
- [x] Verify: `npm run typecheck`, `npm run lint`, `npm run test`,
      `npm run test:e2e` and `npm run build` green; `server/` has no diff;
      the FavoritesPage suites pass with at most timing-neutral updates
      (their success-driven marking behavior is Phase 3).

**Tests:**

- [x] New E2E flow `favorites-optimistic.js` HomePage scenarios (red ->
      green): optimistic flip before the delayed response, reconciliation +
      toast after it, rollback + error toast on abort.
- [x] Entity suite: pending actions, effective ids/count, force semantics,
      settle-restores-verbatim, pending-ids selector (red -> green).
- [x] Task suite: dispatch order for success and failure (red -> green).
- [x] Revised HomePage suites: hearts and count flip with deferred requests,
      toast timing unchanged, failure rollback (red -> green).
- [x] All pre-existing suites stay green: `useShowList.test.tsx`,
      `syncFavoritesSummary.test.ts`, the FavoritesPage suites, every search
      and store suite, all server suites.

**When ready:**

With a delayed or failing backend, the HomePage heart and the count button
flip on click and reconcile or roll back when the request settles; the
toasts keep their exact current messages and timing; the favorites Entity
still stores backend payloads verbatim beside the transient overlay; every
suite — new, revised and pre-existing — is green with `server/` untouched.

**Acceptance Criteria:**

- [x] With a delayed POST, the HomePage heart renders the favorite state and
      the count button increments by 1 before the response arrives (unit +
      E2E).
- [x] With a delayed DELETE, the heart renders the non-favorite state and the
      count decrements by 1 before the response arrives (unit + E2E).
- [x] After a successful toggle the hearts and count match the returned
      `{ count, ids }` summary and the existing success toast appears with
      its current message (unit + E2E).
- [x] After a failed toggle the heart and count are identical to their
      pre-click values, the error toast is shown and no success toast appears
      (unit + E2E).
- [x] `replaceFavoritesSummary` still stores the backend `ids` verbatim; the
      pending overlay is a separate transient field cleared on every settle
      (Entity suite).
- [x] `npm run typecheck`, `npm run lint`, `npm run test`,
      `npm run test:e2e` and `npm run build` pass; `server/` is untouched.

**Phase 1 execution notes (recorded decisions and deviations):**

- E2E interception deviation: instead of `route.fetch()`-then-delayed-fulfill
  (which would commit the write to the backend while the response is held),
  the handler in `e2e/favorites-optimistic.js` gates the write **before**
  fetching — `release()` then performs the real request and fulfills,
  `fail()` aborts without ever touching the backend. The optimistic window is
  deterministic, and the flow additionally asserts `summaryIds` is unchanged
  while the write is held. No helper changes to `favorites-helpers.js` were
  needed; the interception lives in the flow module (the helpers file is for
  pure locators and backend probes only).
- Suite-split deviation (120-line budget, sibling-split precedent): the
  deferred-timing HomePage coverage lives in two new suites —
  `favoritesOptimistic.test.tsx` (optimistic add/remove windows, toast only
  after confirmation) and `favoritesOptimisticRollback.test.tsx` (failure
  rollback) — sharing `optimisticHarness.ts` (gate factory, locators), so
  `favoritesToastFlow.test.tsx` needed no changes; its immediate-mock
  assertions stay valid and the toast-timing proof moved into the optimistic
  suite. The Task's in-flight cases live in the sibling
  `toggleShowFavoritePending.test.ts`.
- `favoritesFlow.test.tsx` and `favoritesCountButton.test.tsx` assert no
  update-after-response timing and passed untouched, as anticipated.
- `favoritesToggle.test.tsx` failure test revised from reference-equality
  (`toBe(before)`) to content assertions: with begin/settle dispatched the
  state object changes identity, while the effective ids and the cleared
  pending overlay prove the rollback.

### Phase 2: Disabled-while-pending heart button

**Goal:** While a show's toggle request is in flight, that show's heart
button is disabled — additional clicks send no further requests — and it is
re-enabled once the request settles, in both card layouts and on both pages,
with token-based disabled styling and a recorded design decision.

**Affects:** frontend

**Tasks:**

- [ ] Extend the E2E flow first (red), in `favorites-optimistic.js`: while a
      delayed toggle is in flight the heart button `toBeDisabled()`; a second
      click issues no additional request (route-hit count stays 1); after the
      delayed fulfill — and after an abort — the button is enabled again; a
      mid-flow `page.setViewportSize` below the breakpoint proves the
      disabled state on the mobile row card; the same disabled probe runs
      once on a Favorites page card (shared pending registry).
- [ ] Write the component unit suites first (red): a new
      `FavoriteButton/tests/` suite — the button renders `disabled` exactly
      when the prop is set and the disabled modifier class applies;
      `ShowCard` and `ShowRowCard` suites gain the pending pass-through case
      (presenter-set pending flag reaches the button).
- [ ] Extend `FavoriteButton` with an optional `isPending` prop mapped to the
      native `disabled` attribute, and add the disabled modifier to
      `FavoriteButton.module.css` (reduced opacity, `cursor: not-allowed`,
      hover accent suppressed — exact values recorded as the design
      decision); run `npm run css-types`; mirror the state on the pen.dev
      canvas through the MCP tools or record the deferral per the 003/005
      precedent.
- [ ] Extend the card contracts: `ShowCard` and `ShowRowCard` gain an
      `isPending` boolean passed through to `FavoriteButton`; `ShowList`'s
      View passes the presenter's per-show value; `ShowListProps` stays
      unchanged (no new injected props).
- [ ] Extend `useShowList`: read `selectPendingFavoriteIds` from the Entity
      and expose `isPending(showId)` for both the stored and the injected
      favorites paths, so the HomePage and the Favorites page get the
      disabled state from the same registry; update the JSDoc.
- [ ] Verify: all gates green (`typecheck`, `lint`, `test`, `test:e2e`,
      `build`); the HomePage and FavoritesPage flows otherwise behave exactly
      as after Phase 1.

**Tests:**

- [ ] E2E disabled/no-second-request/re-enable probes, both layouts, both
      pages (red -> green).
- [ ] `FavoriteButton` suite: disabled attribute + modifier class (red ->
      green); card pass-through suites (red -> green).
- [ ] All pre-existing suites stay green, including the Phase 1 optimistic
      flows.

**When ready:**

A heart whose toggle is in flight is visibly disabled and rejects clicks on
both pages and in both layouts, re-enables on settle, and no click ever
produces more than one backend request; the design decision and canvas
handling are recorded; every suite is green.

**Acceptance Criteria:**

- [ ] While a show's toggle request is in flight, its heart button is
      disabled; clicking it sends no further request (E2E route-hit count +
      unit).
- [ ] The button is re-enabled once the request resolves, on success and on
      failure (E2E).
- [ ] Each non-rejected heart click results in exactly one `POST
/api/favorites` or `DELETE /api/favorites/:id` request (E2E).
- [ ] The disabled state renders in the desktop `ShowCard` and the mobile
      `ShowRowCard`, on the HomePage and on the Favorites page (E2E viewport
      probes + component suites).
- [ ] The disabled styling uses existing tokens where available, the exact
      values are recorded as the design decision, the CSS Module
      declarations are regenerated, and the canvas mirroring is done or
      recorded as a deferred follow-up.
- [ ] `npm run typecheck`, `npm run lint`, `npm run test`,
      `npm run test:e2e` and `npm run build` pass; `server/` is untouched.

### Phase 3: Optimistic soft removal on the Favorites page

**Goal:** On the Favorites page, clicking the heart on a favorite card grays
it out (soft-removed) immediately and clicking the heart of a grayed-out
card restores it immediately — before the backend responds — with no list
refetch; a failure reverts the marking and shows the existing error toast, a
success keeps the existing toast after confirmation. The phase closes with a
re-check of every PRD acceptance criterion.

**Affects:** frontend

**Tasks:**

- [ ] Extend the E2E flow first (red), in `favorites-optimistic.js`:
      FavoritesPage scenarios with delayed interception — a delayed DELETE
      grays the card out immediately (reuse the `cardArticle` computed-style
      probes with the recorded 005 values), flips its heart label, and issues
      no `GET /api/favorites` refetch (route-hit count); after the fulfill
      the removal toast appears and the list metadata stays; an aborted
      DELETE restores the full-color favorite card with the error toast and
      no success toast; a delayed POST on a grayed-out card restores it in
      place immediately, and an abort re-grays it.
- [ ] Revise the FavoritesPage unit suites first (red) at the deferred mock
      boundary: `favoritesSoftRemoval.test.tsx` — the marking flips before
      the request settles and reverts on failure, with no refetch in either
      case; `favoritesToast.test.tsx` — success toasts still appear only
      after confirmation; `favoritesRemovalFailure.test.tsx` — the failed
      removal/re-add now rolls the optimistic flip back (previously: nothing
      changed because nothing had flipped); `favoritesRemoval.test.tsx` and
      the harness updated where they encode success-time flips.
- [ ] Extend the shared `useFavoriteToggle` hook: `onToggled(show,
wasFavorite)` fires optimistically at click time with the pre-click
      state (the Task direction is decided before the flip), a new
      `onToggleFailed(show, wasFavorite)` fires on the error result for the
      caller's rollback; the success/error toasts keep their exact messages
      and timing; the returned `boolean | null` contract and the
      `toggleShowFavorite` Task stay unchanged; update the JSDoc.
- [ ] Rework `useSoftRemoval`: the marking flips through the optimistic
      callback and reverts through the failure callback; the fresh-fetch
      invalidation (`marking.shows === shows`) and the derived
      `isFavorite`/`isRemoved` predicates stay as they are.
- [ ] Update the stale doc comments describing the success-only flow
      (`useSoftRemoval`, `useFavoriteToggle`, `useFavoritesPage` JSDoc).
- [ ] Final verification: all gates green (`css-types` if any CSS changed,
      `typecheck`, `lint`, `test`, `test:e2e`, `build`); an automated E2E
      round through every PRD user scenario in both viewports; re-check
      every PRD acceptance criterion against the finished feature; `server/`
      has no diff.

**Tests:**

- [ ] E2E FavoritesPage optimistic gray-out/restore, no-refetch, rollback and
      toast-timing probes (red -> green).
- [ ] Revised soft-removal, toast and removal-failure unit suites with
      deferred requests (red -> green).
- [ ] All pre-existing suites stay green, including the Phase 1–2 optimistic
      and disabled flows and every HomePage suite.

**When ready:**

Favorites page cards flip between normal and grayed-out state on click,
before any response, without refetching the list; failures revert the flip
with the error toast; successes keep the confirmation-time toasts; the
complete automated suite is green and every PRD acceptance criterion is
re-verified.

**Acceptance Criteria:**

- [ ] On the Favorites page, clicking the heart on a favorite card renders it
      grayed out and semi-transparent before the DELETE response arrives,
      with no `GET /api/favorites` refetch (unit + E2E).
- [ ] Clicking the heart on a grayed-out card restores its full-color
      favorite state before the POST response arrives (unit + E2E).
- [ ] If the toggle fails, the marking reverts to its pre-click state (a
      failed removal leaves the card normal, a failed re-add leaves it
      grayed out), the error toast is shown and no success toast appears
      (unit + E2E).
- [ ] Success toasts still appear only after the backend confirms, with the
      unchanged messages; the deferred-refresh behavior of feature 005
      (subhead/pagination metadata, fresh fetch on page change/leave/reload)
      is intact.
- [ ] The heart button of the toggled Favorites page card is disabled while
      its request is in flight (Phase 2 registry, re-verified here).
- [ ] Every PRD acceptance criterion is re-checked against the finished
      feature, `npm run typecheck`, `npm run lint`, `npm run test`,
      `npm run test:e2e` and `npm run build` pass, and `server/` is
      untouched.
