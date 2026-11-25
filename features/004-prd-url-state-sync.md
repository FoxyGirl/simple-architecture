# PRD: URL State Synchronization

**Date**: 2026-11-20
**Status**: Draft

## Purpose

Users lose their view state — the search term, the genre filter, and the
results page on the HomePage, and the list page on the Favorites page — when
they reload the tab, follow a shared link, or use the browser back/forward
buttons, because this state currently lives only in component memory. This
feature makes the URL the single source of truth for these values so that
every view state is linkable, reload-safe, and restored by history navigation.

## User Scenarios

- User types into the search field -> the input text (`draftSearch`) updates
  immediately without touching the URL; after the debounce period elapses, the
  trimmed value is written to the URL `search` parameter and results are
  fetched based on the URL values.
- User clears the search field -> after the debounce period the `search`
  parameter is removed from the URL and the page returns to its idle/empty
  state.
- User selects a genre filter -> the URL `genre` parameter is updated, the URL
  `page` parameter resets to 1, and results are fetched according to the URL.
- User switches to another results page -> the URL `page` parameter is updated
  and the corresponding results page is fetched.
- User submits a new search term -> the URL `genre` and `page` parameters reset
  to their defaults, matching the existing new-search reset behavior.
- User reloads the page with parameters in the URL -> the search input text,
  the selected genre, the active page, and the corresponding results are
  restored from the URL.
- User opens a shared or bookmarked URL containing parameters -> the app shows
  the applied search, filter, page, and results that the URL describes, with no
  extra user action.
- User switches to another favorites list page -> the URL `page` parameter of
  the Favorites route is updated and the corresponding list page is fetched.
- User reloads the Favorites page or opens a shared Favorites URL containing
  a `page` parameter -> the corresponding favorites list page is restored from
  the URL.
- User removes a show on the Favorites page -> the list is refetched based on
  the URL page, with the existing backend clamping behavior when the last page
  shrinks unchanged.
- User presses the browser back/forward buttons -> the app displays the
  search/genre/page state of the visited URL, and the search input shows the
  `search` value from the URL; on the Favorites route, the corresponding
  favorites list page is displayed.
- User edits the URL on either route to contain an invalid value (e.g.
  `page=abc`, `page=0`, an unknown genre) -> the app falls back to the default
  for that parameter and does not crash.
- User navigates to the Favorites page and returns to the HomePage -> the
  search term, genre, page, and results are preserved through the URL
  parameters.

## In scope

- URL query parameters `search`, `genre`, and `page` on the HomePage route,
  serving as the single source of truth for the applied search term, the
  selected genre filter, and the current results page number.
- A URL query parameter `page` on the Favorites route, serving as the single
  source of truth for the current favorites list page.
- The draft/applied search distinction: `draftSearch` is the local state of
  the search input; `search` is the URL parameter holding the applied search
  term. After the existing debounce period (currently 800 ms), the trimmed
  `draftSearch` value is written to the URL.
- Components read the synchronized values from the URL and update the URL
  whenever the values change (debounced search writes, genre selection, page
  changes on either route).
- Data requests are executed based on the values in the URL: `/api/search`
  requests derive from the HomePage parameters and favorites list requests
  derive from the Favorites `page` parameter; a change of URL parameters
  drives a corresponding request, and the rendered results always correspond
  to the current URL.
- Browser history behavior: debounced search writes replace the current
  history entry (typing does not create an entry per keystroke batch); genre
  and page changes on either route push new history entries; back/forward
  navigation restores the state described by each entry.
- Default and invalid value handling: a missing or empty `search` means no
  applied search (idle state); a missing or unknown `genre` means "All
  genres"; a missing, non-numeric, or sub-1 `page` means page 1 on either
  route. Invalid values fall back to the defaults without errors.
- Preservation of the existing reset semantics in the URL: a newly applied
  search resets `genre` and `page` to their defaults; a genre change resets
  `page` to 1.
- Removal of the Redux `searchSession` slice and its save/restore mechanism:
  state restoration (including returning from the Favorites page) is achieved
  through the URL parameters instead, so the URL is the only source of truth
  and no client state duplicates the synchronized values.
- Automated tests for the new behavior: frontend unit/component tests
  (Vitest + Testing Library) and Playwright E2E coverage of the URL
  synchronization scenarios on both routes (deep link, reload, back/forward,
  defaults).

## Out of scope

- URL synchronization of Favorites page state beyond its `page` parameter —
  the Favorites page has no search, genre filter, or sorting to synchronize.
- Any other state in the URL: sorting, scroll position, favorite toggles, or
  UI state such as open menus.
- A user-facing "copy link" / share button or other sharing UI.
- Changes to the backend `/api/search` or `/api/favorites` endpoints, their
  caching, filtering, or pagination semantics.
- Changes to the debounce duration or to the visual design of the search
  field, genre filter, or pagination controls.
- Persisting view state anywhere besides the URL (no localStorage or Redux
  duplication of the synchronized values).

## Technical limitations

- Routing is React Router 7 (`react-router-dom`) with the existing `/`
  (HomePage) and `/favorites` routes; URL parameter reading and writing must
  integrate with this router and must not bypass it (no manual
  `history.pushState` outside the router).
- The three HomePage values currently live in Presenter local state: the input
  text (with the 800 ms debounce) in the search field logic, and the
  genre/page selection in the page Presenter. The app follows the documented
  View/Presenter/Task/Entity architecture (`docs/architecture.md`); the URL
  synchronization must conform to these documented patterns, and data fetching
  must continue to run through the existing Task/API and Redux Entity layers.
- The Favorites page currently fetches list page 1 on mount and stores the
  served envelope — including the backend-clamped page after a removal
  shrinks the last page — in the favorites Entity; URL synchronization must
  derive the initial and subsequent list pages from the URL instead of the
  hard-coded page 1, without changing the existing removal/refetch/clamping
  behavior.
- The Redux `searchSession` slice currently persists the last successful
  search and seeds the HomePage on mount for in-session restoration; its only
  consumer is that mount-time restoration, so URL-based restoration replaces
  it entirely and the slice (together with its persistence Task and
  restoration hooks) is removed. Existing tests that seed or reset the
  session (restoration tests, the shared test harness, Entity test stores)
  are reworked to the URL-based behavior.
- Genre values are plain strings validated against the client-side genre list
  ("All genres" default); the backend `/api/search` clamps out-of-range page
  numbers in its response — the existing clamping behavior is unchanged and
  the PRD does not require the URL to be rewritten to the clamped page.
- Browser history is finite and controlled by the user: back/forward can land
  on any previously visited URL, including ones with parameters that no longer
  yield results (e.g. after a backend restart cleared the TVmaze cache), which
  the existing request/error handling already covers.
- The repo mandates a test-first workflow (AGENTS.md): Vitest for the frontend
  and Playwright E2E against the local TVmaze stub; URL-driven behavior (deep
  links, reloads, history navigation) must be verifiable in this harness.

## Acceptance Criteria

- [ ] The applied search term, the selected genre, and the current page number
      appear in the HomePage URL as the `search`, `genre`, and `page` query
      parameters.
- [ ] Typing into the search field updates the input immediately without
      changing the URL; after the debounce period the URL `search` parameter
      equals the typed value (trimmed).
- [ ] Clearing the search field removes the applied search from the URL after
      the debounce period, and the page shows its idle/empty state.
- [ ] Selecting a genre updates the URL `genre` parameter and resets the URL
      `page` parameter to 1; applying a new search term resets the URL `genre`
      and `page` parameters to their defaults.
- [ ] Changing the results page updates the URL `page` parameter.
- [ ] Every `/api/search` request is derived from the current URL parameter
      values, and the displayed results (query echo, genre selection, active
      page) match the URL.
- [ ] Loading a URL with parameters directly (new tab or reload) restores the
      search input text, the selected genre, the active page, and fetches the
      corresponding results without extra user interaction.
- [ ] Genre and page changes push browser history entries and the back/forward
      buttons restore the corresponding state, including the search input
      text; debounced search writes replace the current entry so typing does
      not create one history entry per keystroke.
- [ ] Missing or invalid parameters fall back to defaults without errors: no
      or empty `search` -> idle state; unknown or missing `genre` -> "All
      genres"; non-numeric or sub-1 `page` -> page 1.
- [ ] The current favorites list page appears in the `/favorites` URL as the
      `page` query parameter; changing the page on the Favorites page updates
      the parameter and the displayed list matches the URL.
- [ ] Loading `/favorites?page=N` directly (new tab or reload) shows page N of
      the favorites list; a missing, non-numeric, or sub-1 `page` on that
      route falls back to page 1 without errors.
- [ ] Favorites page changes push browser history entries, and the
      back/forward buttons restore the corresponding favorites list page.
- [ ] Removing a show on the Favorites page refetches the list based on the
      URL page, with the existing backend clamping behavior when the last
      page shrinks unchanged.
- [ ] After navigating to the Favorites page and returning to the HomePage,
      the search term, genre filter, page number, and corresponding results
      are preserved via the URL parameters.
- [ ] The URL is the single source of truth for the synchronized values: the
      Redux `searchSession` slice is removed from the store, and no other
      persisted client state determines the restored view on either route.
- [ ] The URL synchronization scenarios on both routes (deep link, reload,
      debounced search write, genre/page reset, defaults for invalid values,
      favorites page sync, back/forward navigation) are covered by automated
      tests.
- [ ] `npm run typecheck`, `npm run lint`, `npm run test`, and
      `npm run test:e2e` pass.
