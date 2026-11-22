# PRD: Optimistic Favorites Toggle

**Date**: 2026-11-22
**Status**: Draft

## Purpose

Today the heart state and the favorites count change only after the backend
responds, so on a slow connection the toggle feels unresponsive. This feature
makes the favorite toggle optimistic: the UI reflects the new state immediately
on click, the backend request runs in the background, and a failure rolls the
UI back to its previous state.

## User Scenarios

- User clicks the heart on a non-favorite show on the HomePage -> the heart
  switches to the favorite state and the favorites-count button increments
  immediately, before the backend responds; when the request succeeds, the
  existing add toast appears and the state stays.
- User clicks the heart on a favorited show on the HomePage -> the heart
  switches to the non-favorite state and the count decrements immediately; on
  success the existing removal toast appears.
- User clicks the heart on a favorite card on the Favorites page -> the card
  turns grayed out and semi-transparent (soft-removed) immediately, before the
  backend responds; on success the existing removal toast appears and the list
  is not refetched.
- User clicks the heart on a grayed-out card on the Favorites page -> the card
  returns to its normal full-color favorite state immediately; on success the
  existing add toast appears.
- User clicks the heart while that show's toggle request is still in flight ->
  the click is rejected (the button is disabled) and no second request is
  sent.
- A toggle request fails (network error or backend error) -> the optimistic
  change is rolled back (heart, count, and grayed-out marking return to their
  pre-click state), the existing error toast is shown, and no success toast
  appears.

## In scope

- Optimistic heart state on show cards of both the HomePage and the Favorites
  page, in the desktop (`ShowCard`) and mobile (`ShowRowCard`) layouts.
- Optimistic update of the HomePage favorites-count button (increment on add,
  decrement on removal), reconciled with the backend `{ count, ids }` summary
  when the response arrives.
- Immediate application of the Favorites page soft-removal visual state (the
  grayed-out marking from feature 005) on click, with rollback on failure.
- Disabling the heart button of the show whose toggle request is in flight,
  until the request resolves; exactly one backend request per click.
- Rollback on failure: the optimistic UI state reverts to the pre-click state;
  the existing error toast behavior is kept.
- Success feedback unchanged: the existing add/remove toasts still appear only
  after the backend confirms, with the same messages.
- On success, the backend summary response remains the authoritative state and
  is applied as today (no refetch of the favorites list on the Favorites
  page — the deferred-refresh behavior of feature 005 is preserved).
- Automated tests for the new behavior (Vitest + Testing Library for the
  frontend, Playwright E2E), including updates to the existing tests that
  assert the current update-after-response behavior.

## Out of scope

- Backend changes: no new endpoints, no response shape changes, no
  server-side pending state — add and remove remain immediate
  `POST /api/favorites` / `DELETE /api/favorites/:id`.
- Optimistic behavior for anything other than the favorite toggle (search,
  pagination, favorites list fetching).
- Undo affordances, retry queues, or offline operation support.
- Changes to the Favorites page list composition: cards still stay in the list
  when soft-removed and disappear only after a fresh fetch.
- Reconciliation between multiple clients modifying the same shared favorites
  list.
- Any change to the toast messages, types, or the error-toast behavior.

## Technical limitations

- The favorites Entity currently stores the backend-synced summary verbatim —
  the slice comments state that "nothing is merged or recomputed
  client-side" — and the HomePage count is derived from the mirrored ids
  (`selectFavoritesCount`). Introducing an optimistic layer must respect the
  documented Simple Architecture (View/Presenter/Task/Entity): Redux
  mutations are performed only by Tasks via `store.dispatch`, Presenters
  consume selectors, and per `docs/architecture.md` non-application
  coordination state must not be stored in Redux. Where the optimistic/pending
  state lives (Entity vs. Presenter view state) is a design decision for the
  plan phase, not assumed here.
- The shared `toggleShowFavorite` Task dispatches only after a successful
  response today; with optimistic updates it must also guarantee that a
  failed or superseded response never leaves stale optimistic state in the
  UI (the architecture already forbids dispatching stale responses).
- The shared `FavoriteButton` component has no `disabled` prop; it must be
  extended. It is shared by both pages and both card layouts, so the change
  must not alter existing rendering contracts elsewhere.
- The shared `useFavoriteToggle` hook currently reports the toggle outcome to
  pages only on success (`onToggled`); the Favorites page flips its removed
  marking there (`useSoftRemoval`). Both the immediate flip and the rollback
  must fit this Presenter-level flow.
- The disabled/pending visual state of the heart button is a visual change and
  is subject to the design system workflow: the pen.dev canvas
  (`design/ScreenScout-design.pen`) and `web/src/styles/tokens.css` are the
  sources of truth for its styling.
- Existing test suites encode the current update-after-response behavior
  (e.g. `web/src/pages/HomePage/tests/favoritesToggle.test.tsx`,
  `favoritesToastFlow.test.tsx`, the `FavoritesPage/tests/` toast,
  soft-removal and removal-failure suites, and the Playwright favorites
  flows) and must be revised together with the feature; the repo mandates a
  test-first workflow (AGENTS.md).

## Acceptance Criteria

- [ ] With a delayed backend response, clicking the heart on a non-favorite
      show on the HomePage renders the favorite heart state and increments the
      favorites-count button by 1 before the `POST /api/favorites` response
      arrives.
- [ ] With a delayed backend response, clicking the heart on a favorited show
      on the HomePage renders the non-favorite heart state and decrements the
      count by 1 before the `DELETE /api/favorites/:id` response arrives.
- [ ] After a successful toggle, the UI state (hearts, count) matches the
      backend `{ count, ids }` summary returned by the response, and the
      existing success toast appears with its current message.
- [ ] After a failed toggle, the heart state, the count, and the Favorites
      page grayed-out marking are identical to their pre-click values, the
      error toast is shown, and no success toast is shown.
- [ ] On the Favorites page, clicking the heart on a favorite card renders it
      grayed out and semi-transparent before the response arrives, without
      triggering a `GET /api/favorites` list refetch; clicking the heart on a
      grayed-out card restores its full-color favorite state before the
      response arrives.
- [ ] While a show's toggle request is in flight, its heart button is disabled
      and additional clicks send no further requests; the button is re-enabled
      once the request resolves (success or failure).
- [ ] Each heart click that is not rejected by the disabled state results in
      exactly one backend request (`POST /api/favorites` or
      `DELETE /api/favorites/:id`).
- [ ] No backend code or API contract is changed by this feature.
- [ ] The optimistic behavior works in both the desktop and mobile card
      layouts on both pages.
- [ ] `npm run typecheck`, `npm run lint`, `npm run test`, and
      `npm run test:e2e` pass, with the previously update-after-response
      tests revised and new tests covering the optimistic update, rollback,
      and disabled-while-pending behavior.
