# PRD: Favorites Soft Removal

**Date**: 2026-11-20
**Status**: Draft

## Purpose

Removing a show on the Favorites page currently deletes it from the visible
list immediately, so an accidental removal is hard to notice and undo. This
feature keeps a removed show visible in a grayed-out, semi-transparent state
so the user can add it back with one click, and defers the frontend list
refresh until the user leaves or reloads the Favorites page.

## User Scenarios

- User clicks the heart on a favorite show on the Favorites page -> the
  backend removes the show, the card stays in the list rendered grayed out and
  semi-transparent with its heart in the non-favorite state, and the list is
  not refetched.
- User clicks the heart on a grayed-out (removed) card -> the backend re-adds
  the show and the card returns to its normal full-color favorite state in
  place, without a list refetch.
- User navigates away from the Favorites page (back button, global navigation,
  any other route change) or reloads it -> the list is fetched fresh from the
  backend: removed shows are gone, re-added shows are present.
- User switches to another pagination page on the Favorites page -> that page
  is fetched fresh from the backend, as it is today.
- User removes a show on the Favorites page and returns to the HomePage -> the
  favorites-count button already reflects the removal.

## In scope

- Deferred list refresh on the Favorites page: after a successful removal or
  re-add, the currently displayed favorites list page is **not** refetched. A
  fresh fetch happens only when the user leaves the page, reloads it, or
  switches pagination pages (existing pagination behavior).
- A visual "removed" state for show cards on the Favorites page: grayed out
  and semi-transparent, clearly distinguishable from an active favorite card,
  in both the desktop (`ShowCard`) and mobile (`ShowRowCard`) layouts.
- The heart button of a grayed-out card shows the non-favorite state and
  remains clickable to add the show back; a successful re-add restores the
  card's normal appearance in place.
- Removal and re-add still hit the backend immediately through the existing
  endpoints (`DELETE /api/favorites/:id`, `POST /api/favorites`); the soft
  behavior is frontend-only.
- The backend favorites summary (`{ count, ids }`) keeps syncing on every
  successful toggle, so the HomePage count button updates immediately —
  unchanged from today.
- The Favorites page subhead count ("N shows saved") and the pagination
  controls keep their fetched values after removals/re-adds until the next
  fresh fetch (page change, leave, or reload).
- Existing success toasts are preserved unchanged: a successful removal and a
  successful re-add each show their current toast message.
- Failure behavior: a failed removal leaves the card in its normal favorite
  state (existing silent failure); a failed re-add leaves the card grayed out.
- Empty state: when every show of the current page has been removed, the cards
  all remain visible grayed out; the empty state appears only after a fresh
  fetch that returns an empty list.
- Automated tests for the new behavior (Vitest + Testing Library for the
  frontend, Playwright E2E), including updates to the existing tests that
  assert the current immediate-removal behavior.

## Out of scope

- Undo via a toast action, a dedicated Undo button, or any restore affordance
  other than the heart on the grayed-out card.
- Backend changes: no new endpoints, no server-side "pending"/soft-deleted
  state — removal remains an immediate plain DELETE.
- Any behavior change on the HomePage: hearts there keep toggling favorites
  immediately with the list state as today; the removed visual state never
  renders on the HomePage.
- Persistence of the grayed-out state across pagination page changes,
  navigation away, or reload — after any fresh fetch the list shows backend
  state only.
- Bulk restore, undo history, or multi-step undo.
- Restoring or reconciling removed shows when multiple clients modify the same
  shared favorites list.
- Search, filtering, or sorting on the Favorites page.

## Technical limitations

- The Favorites page Presenter (`useFavoritesPage`) currently refetches the
  current page after every successful removal via the `fetchFavoritesPage`
  Task; that refetch must no longer run on removal/re-add, while the mount and
  page-change refetches stay.
- The favorites Entity stores a single list-page envelope
  (`replaceFavoritesList`) with no per-page cache; the "removed" marking is
  per-show view state of the currently displayed page and must fit the
  documented Simple Architecture (View/Presenter/Task/Entity) without the
  Presenter's removal state leaking into the backend-synced Entity data.
- `ShowList`/`ShowCard`/`ShowRowCard`/`FavoriteButton` are shared between the
  HomePage and the Favorites page; the Favorites page currently passes a
  constant `isFavorite = () => true`. Adding a removed state must not change
  HomePage rendering or the shared components' existing contract for it.
- The grayed-out/semi-transparent card state is a new visual element and is
  subject to the design system workflow: the pen.dev canvas
  (`design/ScreenScout-design.pen`) and `web/src/styles/tokens.css` are the
  sources of truth for its styling tokens.
- The repo mandates a test-first workflow (AGENTS.md); existing suites
  (`web/src/pages/FavoritesPage/tests/favoritesRemoval.test.tsx` and the
  Playwright favorites flows) encode the current immediate-removal behavior
  and must be revised together with the feature.
- Removal and re-add outcomes are only known after the backend responds; the
  visual state transitions must be driven by the Task result (success/failure),
  not optimistically, to stay consistent with the backend as the single source
  of truth for favorites.

## Acceptance Criteria

- [ ] Clicking the heart on a favorite show on the Favorites page sends
      `DELETE /api/favorites/:id`; on success the card remains in the list
      rendered grayed out and semi-transparent.
- [ ] After a successful removal or re-add on the Favorites page, no
      `GET /api/favorites` list refetch occurs until the user changes the
      pagination page, leaves the page, or reloads it.
- [ ] The heart button of a grayed-out card shows the non-favorite state
      (`aria-pressed="false"`, "Add {name} to favorites" label) and is
      clickable.
- [ ] Clicking the heart on a grayed-out card sends `POST /api/favorites`; on
      success the card returns to its normal full-color favorite state in
      place, without a list refetch.
- [ ] The Favorites page subhead count and pagination controls keep their
      values after removals and re-adds until the next fresh fetch.
- [ ] The HomePage favorites-count button reflects removals and re-adds made
      on the Favorites page immediately (existing summary sync unchanged).
- [ ] Leaving the Favorites page and returning, or reloading it, shows a list
      fetched fresh from the backend: removed shows are absent, re-added shows
      are present, and no grayed-out cards remain.
- [ ] Switching pagination pages on the Favorites page fetches the target page
      fresh from the backend (existing behavior unchanged).
- [ ] If the removal request fails, the card keeps its normal favorite state
      and no removal toast is shown (existing silent-failure behavior).
- [ ] If the re-add request fails, the card remains grayed out and no add
      toast is shown.
- [ ] A successful removal shows the existing removal toast; a successful
      re-add shows the existing add toast — messages unchanged.
- [ ] When every show on the current page is removed, all cards remain visible
      grayed out and the empty state does not appear until a fresh fetch
      returns an empty list.
- [ ] The removed state renders in both desktop and mobile card layouts and
      never renders on the HomePage.
- [ ] `npm run typecheck`, `npm run lint`, `npm run test`, and
      `npm run test:e2e` pass, with the previously immediate-removal tests
      updated and new tests covering the deferred-refresh behavior.
