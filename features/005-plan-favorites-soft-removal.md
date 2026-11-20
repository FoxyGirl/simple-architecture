# Plan: Favorites Soft Removal

**PRD:** features/005-prd-favorites-soft-removal.md

**Date:** 2026-11-20

> **Approach.** The feature is frontend-only — the PRD excludes backend
> changes, and the existing shared `toggleShowFavorite` Task already performs
> both directions (POST/DELETE) and dispatches the `{ count, ids }` summary
> into the Entity, so the HomePage count button keeps updating immediately
> with no work. Phase 1 is the tracer bullet: the complete behavior core in
> the FavoritesPage presenter — the post-removal list refetch is dropped, a
> presenter-owned removed-ids marking keeps removed shows listed with their
> heart flipped to the non-favorite state, a heart click on a marked show
> re-adds it and restores it in place, toasts and silent-failure semantics
> stay unchanged, and the marking resets on every fresh-fetch trigger (URL
> page change; leaving/reloading resets naturally through remount). Phase 2
> adds the visuals: an optional removed predicate through `ShowList` into
> both card variants and the grayed-out/semi-transparent modifier styles,
> proven by computed-style E2E probes in both layouts. Every phase leaves the
> app fully functional, so work can stop after any completed phase.
>
> **Testing.** Red -> green per AGENTS.md: each phase writes its automated
> tests before the implementation. All favorites-mutating E2E stays in the
> single `favorites.spec.js` (parallel Playwright workers share one backend
> with in-memory favorites — mutations must remain sequential); the new
> scenario joins the established flow-module pattern as
> `e2e/favorites-soft-removal.js`. Two existing flow modules
> (`favorites-list.js`, `favorites-url.js`) encode the immediate-removal
> behavior and are revised to the deferred-refresh assertions — their
> refetch/clamp assertions move behind an explicit reload. Unit suites mock
> at the `@api/favorites` boundary through `favoritesHarness.tsx`, whose fake
> backend gains an `add` implementation. jsdom renders the mobile
> `ShowRowCard` variant (the setup mocks `matchMedia` to `false`) while the
> Playwright default viewport (1280px) renders the desktop `ShowCard` —
> together they cover both required layouts; Phase 2 additionally resizes
> the viewport mid-flow to prove the row card in a real browser.
>
> **Key decisions (recorded):**
>
> - The removed marking is presenter-owned view state of the current list
>   page, never Entity data: the favorites Entity stays backend-synced only
>   (PRD limitation). It lives in a new presenter-aspect hook
>   `FavoritesPage/logic/useSoftRemoval.ts`, mirroring the HomePage
>   `useShowFavorites` aspect pattern and keeping `useFavoritesPage.ts`
>   (84 lines) inside the 120-line `max-lines` budget.
> - The marking resets whenever the URL page changes (a fresh fetch shows
>   backend state only, per the PRD out-of-scope rule); leaving or reloading
>   resets it naturally because the presenter state dies with the component.
> - No optimistic transitions: the heart flip, the marking and the restore
>   happen only on the Task's success result; failures stay silent and change
>   nothing (PRD limitation — the backend is the single source of truth).
> - `ShowList`/`ShowCard`/`ShowRowCard` gain an optional removed contract
>   (predicate on the list, boolean on the cards, defaulting to "not
>   removed"): the HomePage passes nothing, its rendering and its suites stay
>   untouched, satisfying the PRD rule that the shared components' HomePage
>   contract is unchanged.
> - Toasts are unchanged: a removal keeps `notify.info` with
>   `TOAST_MESSAGES.REMOVED`, a re-add uses `notify.success` with
>   `TOAST_MESSAGES.ADDED` — the same messages the HomePage already shows.
> - The exact grayscale/opacity values of the removed state are a design
>   decision recorded during Phase 2. The pen.dev MCP tools report the plan
>   usage limit reached for this billing period (confirmed while writing this
>   plan), so canvas mirroring of the new visual state is a deferred
>   follow-up, exactly as recorded in plan 003; the `.pen` file is never
>   touched outside the MCP design tools. Styling uses the existing tokens
>   where possible (motion tokens for the transition); `tokens.css` has no
>   opacity/desaturation token, so the modifier uses plain values — recorded
>   with the design decision.
>
> **Constraints carried through every phase:** `server/` is untouched (grep
> /diff proof); source files <= 120 lines (ESLint `max-lines`, test files
> included — the sibling-suite split precedent applies if a rewritten suite
> would grow past the budget); TypeScript strict (`noUncheckedIndexedAccess`,
> `verbatimModuleSyntax`, `erasableSyntaxOnly`); object shapes as `type`
> aliases in the owning `types.ts`; extensionless import specifiers;
> `index.ts` barrels publishing Views only; Views never touching the store or
> router; Tasks stay plain functions with explicit arguments and
> `store.dispatch` only; navigation and toasts at Presenter level only; CSS
> Modules with generated `.d.ts` (`npm run css-types` after every changed
> module) + `clsx` object form in base-then-modifier order + design tokens.
> The React memoization rules (`rules/react-memoization.md`) apply to every
> hook reworked here: no memoization by default, `useCallback` only for a
> concrete referential-stability reason, complete dependency arrays.

## Implementation Phases

### Phase 1: Deferred-refresh behavior and removed-show tracking

**Goal:** Removals and re-adds on the Favorites page keep the rendered list
stable: the backend toggle still happens immediately through the existing
Task, a removed show stays listed with its heart flipped to the
non-favorite state, clicking that heart re-adds the show and restores the
card in place, no `GET /api/favorites` refetch runs until the URL page
changes or the page is left/reloaded, subhead and pagination keep their
fetched values, toasts and silent failures behave exactly as today, and the
HomePage count stays immediately in sync. Tracer bullet: the behavior core
every visual assertion of Phase 2 builds on.

**Affects:** frontend

**Tasks:**

- [x] Revise the two existing E2E flow modules first (red):
      `e2e/favorites-list.js` — after the page-1 removal assert the card
      stays visible, its heart now reads `Add Space Tour to favorites`,
      `Page 1 of 2` and `4 shows saved to your list.` persist, and the
      backend `summaryIds` drops to 3; the existing reload step then proves
      the deferred refresh (`Page 1 of 1`, the removed card gone,
      `3 shows saved`), and the back-home `countButton(3)` assertion stays.
      `e2e/favorites-url.js` — the page-2 removal keeps the card visible
      with `Page 2 of 2`, `4 shows saved` and the `?page=2` URL untouched;
      the backend clamping (`Page 1 of 1`, URL not rewritten) moves behind
      an added reload step.
- [x] Write the new E2E flow first (red): `e2e/favorites-soft-removal.js`,
      registered in `favorites.spec.js` — remove a show (card stays, heart
      flips, metadata stable, `summaryIds` shrank), click the flipped heart
      (POST re-add, heart pressed again, `summaryIds` restored, metadata
      still stable), leave through Back to Home (the count button shows the
      removal), return to `/favorites` and reload (fresh list, removed shows
      absent, no stale marking). Extend `e2e/favorites-helpers.js` with the
      needed probes (subhead/page-info text probes, a `cardArticle(page,
name)` locator returning the card element that contains a heading —
      Phase 2's CSS probes reuse it); every touched file stays <= 120 lines.
- [x] Rewrite/extend the unit suites first (red), all at the mocked
      `@api/favorites` boundary: `favoritesRemoval.test.tsx` becomes the
      soft-removal suite (removal keeps the card listed, flips the heart to
      `Add … to favorites` with `aria-pressed="false"`, issues no extra
      `fetchFavoritesListPage` call, subhead/pagination unchanged; re-add
      restores the pressed heart in place with no refetch; a failed re-add
      leaves the card removed; a page change resets the marking — remove a
      show, re-add it directly through the fake backend, paginate away and
      back, the refetched card renders as a favorite; removing every show of
      the page keeps all cards listed and the empty state hidden until a
      remount fetches the empty list). `favoritesToast.test.tsx` gains the
      re-add cases (success -> `notify.success` with the ADDED message;
      failure -> no toast). `favoritesHarness.tsx`'s fake backend gains an
      `add` mirroring `addFavoriteShow`.
- [x] Implement the presenter-aspect hook
      `web/src/pages/FavoritesPage/logic/useSoftRemoval.ts`: the removed-ids
      state, the derived `isFavorite`/`isRemoved` predicates, the toggle
      handler that calls the shared `toggleShowFavorite` Task with the
      card's current state and, on success only, updates the marking and
      toasts (REMOVED via `notify.info`, ADDED via `notify.success`), and
      the reset of the marking when the URL page changes. Memoization
      follows `rules/react-memoization.md`.
- [x] Rewire the FavoritesPage presenter and View: `useFavoritesPage.ts`
      drops the post-removal `fetchFavoritesPage(page)` call, composes the
      aspect hook and exposes `isFavorite`, `isRemoved` (consumed in
      Phase 2) and the toggle handler; `FavoritesPage.tsx` deletes the
      constant `isFavorite = () => true`, passes the presenter's predicate
      and handler to `ShowList`; both files' now-stale doc comments (the
      "every heart removes" note, the refetch description in the presenter
      JSDoc) are updated. The mount/page-change fetch effect, the Tasks and
      the Entity are untouched.
- [x] Verify: `npm run typecheck`, `npm run lint`, `npm run test`,
      `npm run test:e2e` and `npm run build` green; the HomePage suites and
      every other pre-existing suite pass untouched; `server/` has no diff.

**Tests:**

- [x] Revised E2E flows `favorites-list.js` and `favorites-url.js`
      (red -> green): deferred refresh, stable metadata, clamping moved
      behind the reload, back-home count freshness.
- [x] New E2E flow `favorites-soft-removal.js` (red -> green): the full
      remove -> re-add -> leave -> return -> reload round.
- [x] Rewritten soft-removal unit suite and the extended toast suite
      (red -> green), including the failure, reset-on-page-change and
      all-removed cases.
- [x] All pre-existing suites stay green: `FavoritesPage.test.tsx`,
      `favoritesPagination.test.tsx`, the removal-toast cases, every
      HomePage flow suite, the Entity/Task/store suites, all server suites.

**When ready:**

A removal or re-add on the Favorites page changes only the affected card's
heart state and the backend; the rendered list, subhead and pagination stay
exactly as fetched until the URL page changes or the page is left/reloaded;
every suite — revised, new and pre-existing — is green with `server/` and
the HomePage untouched.

**Acceptance Criteria:**

- [x] Clicking the heart on a favorite show on the Favorites page issues
      `DELETE /api/favorites/:id`; on success the card remains in the list
      with its heart at `aria-pressed="false"` and the
      `Add {name} to favorites` label (unit + E2E).
- [x] After a successful removal or re-add, no `GET /api/favorites` list
      refetch occurs until the pagination page changes, the page is left or
      it is reloaded (unit: list-mock call counts; E2E: stable metadata and
      the reload/return refresh).
- [x] Clicking the heart of a removed card issues `POST /api/favorites`; on
      success the card returns to the pressed favorite state in place,
      without a list refetch.
- [x] The subhead count and pagination controls keep their fetched values
      after removals and re-adds until the next fresh fetch.
- [x] The backend `summaryIds` and the HomePage count button reflect a
      removal made on the Favorites page immediately (existing summary
      dispatch unchanged).
- [x] Leaving the Favorites page and returning, or reloading it, shows the
      freshly fetched backend list: removed shows are absent, re-added shows
      are present, no stale marking remains.
- [x] Switching pagination pages fetches the target page fresh (existing
      behavior); after a page-2 removal the URL stays `?page=2` and the
      backend clamping becomes visible at the next fresh fetch.
- [x] A failed removal leaves the card in its normal favorite state with no
      toast; a failed re-add leaves the card removed with no toast.
- [x] A successful removal shows the existing removal toast; a successful
      re-add shows the existing add toast — messages unchanged.
- [x] When every show of the current page is removed, all cards remain
      listed with unpressed hearts and the empty state appears only after a
      fresh fetch returns an empty list.
- [x] `npm run typecheck`, `npm run lint`, `npm run test`,
      `npm run test:e2e` and `npm run build` pass; `server/` is untouched.

### Phase 2: Removed-card visuals (grayed out, semi-transparent)

**Goal:** A removed show is visibly grayed out and semi-transparent in both
card layouts, restores its full-color appearance on re-add, never renders
this state on the HomePage, and the visuals are proven by computed-style
probes in a real browser. The phase closes with a re-check of every PRD
acceptance criterion.

**Affects:** frontend

**Tasks:**

- [ ] Extend the E2E flow first (red): using the `cardArticle` probe — the
      removed desktop card has the recorded grayscale `filter` and reduced
      `opacity` (exact values via `toHaveCSS`, matching the recorded design
      decision); a re-added card loses both; mid-flow
      `page.setViewportSize` below the 1024px breakpoint proves the same
      removed look on the mobile row card; a HomePage card is asserted
      full-color after a removal performed there; after a reload no card on
      the Favorites page carries the removed styling.
- [ ] Write the component unit suites first (red): new
      `ShowCard/tests/` and `ShowRowCard/tests/` suites asserting the
      removed modifier class renders exactly when the removed prop is set
      (the desktop suite mocks `matchMedia` to `matches: true`; class-name
      assertions rely on Vitest's default CSS handling exposing literal
      module class names — confirmed during the red run); extend the
      FavoritesPage soft-removal suite with modifier-class assertions on
      the row card for the removed, restored and failed-re-add cases.
- [ ] Extend the shared components: `ShowList` gains the optional
      `isRemoved?: (showId: number) => boolean` prop (constant-false
      default) and passes a boolean `isRemoved` to `ShowCard` and
      `ShowRowCard`; each card applies
      `clsx(styles.card, { [styles.removed]: isRemoved })` (row equivalent).
      The HomePage callsites pass nothing and stay byte-identical.
- [ ] Add the `.removed` modifier to `ShowCard.module.css` and
      `ShowRowCard.module.css`: grayscale filter + reduced opacity (values
      recorded as the design decision), transitioned with `--duration-base`
      / `--ease-out`, and the hover glow suppressed while removed; run
      `npm run css-types` so both generated `.d.ts` files carry the new
      literal class.
- [ ] Wire the FavoritesPage View: `FavoritesPage.tsx` passes the
      presenter's `isRemoved` (exposed since Phase 1) into `ShowList`;
      record the design decision (exact values, hover treatment) and the
      deferred canvas mirroring (pen.dev plan-usage-limited — the `.pen`
      file untouched).
- [ ] Final verification: `npm run css-types`, `npm run typecheck`,
      `npm run lint`, `npm run test`, `npm run test:e2e` and
      `npm run build` green; a manual dev-pair round through every PRD user
      scenario in both viewports; re-check every PRD acceptance criterion
      against the finished feature.

**Tests:**

- [ ] E2E computed-style probes for the removed/restored states, both
      viewports, the HomePage full-color regression probe and the
      no-removed-styling-after-reload probe (red -> green).
- [ ] Component suites for `ShowCard` and `ShowRowCard` modifier rendering
      (red -> green); FavoritesPage suite class assertions (red -> green).
- [ ] All pre-existing suites stay green; the HomePage suites remain
      untouched and prove the removed state never renders there.

**When ready:**

Removed shows are unmistakably grayed out and semi-transparent in both
layouts, restore in place on re-add, the state never appears on the
HomePage or after any fresh fetch, the complete automated suite is green
and every PRD acceptance criterion is re-verified.

**Acceptance Criteria:**

- [ ] A removed card on the Favorites page renders grayed out and
      semi-transparent in the desktop grid card (E2E `toHaveCSS` with the
      recorded values) and in the mobile row card (E2E viewport resize +
      component suite).
- [ ] A successful re-add restores the card's normal full-color appearance
      in place; a failed re-add keeps it visually removed (component-suite
      class assertions + E2E).
- [ ] The HomePage never renders the removed state: its callsites pass no
      removed prop, its suites are untouched, and the E2E probe asserts a
      full-color card after a HomePage removal.
- [ ] After a reload or any fresh fetch, no card on the Favorites page
      carries the removed styling.
- [ ] The modifier styles use the existing tokens where available, the
      plain-value/design decisions are recorded, the CSS Module
      declarations are regenerated, and the canvas mirroring is recorded as
      a deferred follow-up (pen.dev tooling blocked).
- [ ] `npm run typecheck`, `npm run lint`, `npm run test`,
      `npm run test:e2e` and `npm run build` pass, and every PRD acceptance
      criterion is re-checked against the finished feature.
