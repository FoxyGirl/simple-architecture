# PRD: Restore Home View on Sign-In Page Exit

**Date**: 2026-11-23
**Status**: Draft

## Purpose

Users who leave the HomePage to sign in lose their search term, genre filter and
page number, because every SignInPage exit navigates to a bare `/`. This feature
returns them to the HomePage URL they came from — the way the FavoritesPage's
"Back to Home" already does — so their search results are still there after the
sign-in detour.

## User Scenarios

- User searches, selects a genre and switches to another results page on the
  HomePage -> opens "Sign in" from the account bar -> clicks the account bar's
  "Back to Home" -> the HomePage shows the same search text, the same genre, the
  same page number and the corresponding results.
- User searches, selects a genre and paginates on the HomePage -> signs in with
  a valid email -> after a successful sign-in the HomePage shows the same search
  text, genre, page and results, now with the signed-in favorite controls.
- User opens `/login` directly (new tab or shared link, no HomePage visit) ->
  clicks "Back to Home" -> the app shows `/` with the default Home state while
  remaining signed out.
- User opens `/login` directly -> signs in successfully -> the app shows `/`
  with the default Home state while signed in.
- User reloads `/login` after arriving from a parameterized Home URL ->
  "Back to Home" and a successful sign-in still return to that parameterized
  Home URL.
- User submits an invalid email on `/login` -> stays on `/login` with the inline
  error and the remembered Home URL is kept for a later exit.

## In scope

- Carrying the HomePage URL (path and query, i.e. the `search`, `genre` and
  `page` parameters) through navigation from the HomePage to `/login`.
- The account bar's "Back to Home" on `/login` navigating to the carried
  HomePage URL instead of a bare `/`.
- A successful sign-in on `/login` (the "Continue" submit with a valid email)
  navigating to the carried HomePage URL instead of a bare `/`.
- Fallback to `/` (the current behavior) whenever no HomePage URL was carried —
  for example a direct visit to `/login`, a shared link, or a new tab.
- The carried URL surviving a reload of `/login`, matching the FavoritesPage's
  `fromHome` mechanism.
- HomePage restoration of the search field text, selected genre, active page and
  results from the returned URL parameters, reusing the existing URL-state
  behavior from feature 004.
- Automated tests for both exits, the carried-URL reload and the `/` fallback
  (presenter-level Vitest and Playwright E2E).

## Out of scope

- Adding a "Back to Home" control to the SignInPage body — the account bar
  button remains the only one.
- Changing the FavoritesPage's `fromHome` mechanism or its "Back to Home"
  behavior.
- Changing HomePage search, genre filtering, pagination, URL
  synchronization, request handling or the 800 ms search debounce.
- Restoring HomePage state beyond the URL parameters: scroll position, input
  focus, open menus or any other UI state.
- Returning a signed-in user who opens `/login` to the HomePage URL — that
  redirect stays `/`.
- Any backend, authentication or API change.
- Design canvas changes, new UI or visual restyling.

## Technical limitations

- Routing is React Router 7 (`react-router-dom`), and navigation must run
  through the presenters (`useAccountBar`, `useSignInPage`) as required by
  `docs/architecture.md`; the natural mechanism is the router location state the
  FavoritesPage already uses (`FavoritesLocationState.fromHome`,
  `web/src/pages/types.ts`).
- The account bar renders outside `<Routes>`, so it can read the current
  location on any route. While signed out, the HomePage is the only route that
  offers the "Sign in" entry point (`/favorites` redirects home), so the carried
  view is always the HomePage's.
- Router location state is held in `history.state` and survives a reload of
  `/login` — the same behavior the FavoritesPage reload spec relies on. It does
  not survive opening `/login` in a new tab or from a shared link, so those
  cases fall back to `/`.
- The HomePage already restores its search, genre and page from URL parameters
  (feature 004), so returning to the parameterized URL re-runs the existing
  `/api/search` request through the existing cache and needs no HomePage change.
- The carried URL is in-memory navigation state only; no localStorage, Redux
  slice or other persisted copy of the HomePage view is introduced.
- The existing presenter and component tests in
  `web/src/App/AccountBar/tests/` and `web/src/pages/SignInPage/tests/` mock
  `react-router-dom`; they must account for the location state, and AGENTS.md
  mandates writing the tests before the implementation.
- The current E2E auth spec asserts a bare `/` after both exits from a
  HomePage visited without parameters; that assertion stays valid because the
  carried URL in that case is `/`.

## Acceptance Criteria

- [ ] A signed-out user with an active search, genre and page on the HomePage
      who opens `/login` and clicks the account bar's "Back to Home" lands on
      the HomePage URL carrying that search, genre and page.
- [ ] The restored HomePage shows the same search text in the field, the same
      selected genre, the same active page and the results for those values,
      without the user re-entering anything.
- [ ] A user who signs in successfully from `/login` entered from a
      parameterized Home URL lands on that same HomePage URL, with the search,
      genre, page and results restored.
- [ ] Opening `/login` directly (no HomePage visit) and clicking "Back to Home"
      navigates to `/` with the default Home state, signed out.
- [ ] Opening `/login` directly and signing in successfully navigates to `/`
      with the default Home state, signed in.
- [ ] Reloading `/login` after arriving from a parameterized Home URL keeps the
      carried URL: both "Back to Home" and a successful sign-in return to the
      parameterized Home URL.
- [ ] Submitting an invalid email on `/login` keeps the user on `/login` with
      the inline error and does not discard the carried Home URL.
- [ ] When no Home URL was carried, every SignInPage exit falls back to `/`
      without errors or warnings.
- [ ] A signed-in user who opens `/login` is still redirected to `/`.
- [ ] The FavoritesPage "Back to Home" behavior, the HomePage URL
      synchronization and the search, genre and pagination behavior remain
      unchanged.
- [ ] The new behavior is covered by automated tests (presenter-level Vitest
      and Playwright E2E), and `npm run typecheck`, `npm run lint`,
      `npm run test` and `npm run test:e2e` pass.
