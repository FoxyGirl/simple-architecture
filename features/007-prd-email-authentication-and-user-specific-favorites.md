# PRD: Email Authentication and User-Specific Favorites

**Date**: 2026-11-22
**Status**: Implemented
**Revision**: 2026-11-22 — the dedicated login page became a sign-in modal at
user request: there is no login route, and a signed-out navigation to the
Favorites page redirects to the HomePage without opening the modal.
2026-11-23 — implemented in four phases (backend email sessions, frontend
authentication core, frontend gating, per-user favorites and enforcement); all
acceptance criteria verified against the automated suites.
2026-11-23 — superseded in part by feature 008: the sign-in modal is replaced
by a dedicated Sign In page on the `/login` route, so the "no login route or
page" and modal-only decisions and the related criteria are superseded.
Everything else in this PRD remains in force.

## Purpose

Today the backend keeps a single shared favorites list: every browser sees and
modifies the same favorites, and the app has no way to tell users apart. This
feature adds email-only authentication and makes the favorites list belong to
the signed-in user, so each email keeps its own list across logout and a later
login with the same email.

## User Scenarios

- Unauthenticated user opens the sign-in modal and submits an email -> the
  backend authenticates that email, the modal closes, the app displays the email
  as the current user together with a Logout action, and the user's own
  favorites become visible.
- User dismisses the sign-in modal without submitting -> the modal closes and
  the app stays signed out.
- User logs in with an email that already has favorites on the backend -> the
  favorites count, the heart states and the Favorites page show that user's
  list.
- Signed-in user clicks the heart on a show -> the show is added to (or removed
  from) that user's own favorites list only; no other user's list changes.
- Signed-in user clicks Logout -> the session ends, the email and the Logout
  action disappear, favorite controls are hidden, and searching and browsing
  shows keeps working.
- User logs out and later logs in again with the same email -> the same
  favorites list is shown.
- Unauthenticated user searches, filters by genre and paginates -> results
  behave exactly as today, with no heart buttons and no favorites-count button
  rendered.
- Unauthenticated user opens the Favorites page URL directly -> no favorites
  list is shown and the app redirects to the HomePage; the sign-in modal does
  not open by itself.
- Signed-in user reloads the browser -> they stay signed in with the same email
  and the same favorites, until they log out or the backend restarts.
- User submits an empty or non-email value in the sign-in modal -> the login is
  rejected, an error message is shown in the modal, the modal stays open, and no
  session starts.

## In scope

- A sign-in modal with a single email input, a submit action and a way to
  dismiss it without signing in; no password, registration, or
  password-recovery fields, and no separate login route or page.
- Backend authentication: the backend accepts the submitted email, starts a
  session for it, and can tell which session a favorites request belongs to.
  The signed-in state survives a browser reload.
- Displaying the current user's email and a Logout action while signed in;
  Logout ends the session on the backend and returns the app to the
  unauthenticated state.
- Per-user favorites on the backend: favorites are stored separately for each
  authenticated email, and add, remove, count and paginated list operate only
  on the signed-in user's list.
- Backend enforcement: an add or remove request that does not identify a
  signed-in session is rejected and changes no favorites list.
- Unauthenticated browsing stays fully available: search, genre filtering and
  pagination require no authentication.
- The unauthenticated UI hides the favorite controls: no heart buttons on show
  cards in either the desktop or the mobile layout, and no favorites-count
  button on the HomePage; a sign-in entry point that opens the sign-in modal is
  shown instead.
- The Favorites page is reachable only for a signed-in user: a signed-out
  navigation to it redirects to the HomePage.
- The favorites state the app displays always belongs to the signed-in user:
  after logout no previous user's ids or count remain visible, and logging in
  as another email shows that email's list.
- Favorites persistence per email across logout and a later login with the same
  email, for as long as the backend process runs.
- Automated tests for the new behavior (backend Vitest + supertest, frontend
  Vitest + Testing Library, Playwright E2E), including updates to the existing
  suites that assume a single shared unauthenticated favorites list.

## Out of scope

- Passwords, registration forms, password recovery, email verification or
  confirmation emails, and any second factor.
- A separate sign-up flow, mode or endpoint: submitting an email both creates
  the user and signs them in.
- A dedicated login route or page, and any URL-addressable auth screen —
  signing in happens only in the modal.
- Opening the sign-in modal automatically: on app load, after the Favorites
  redirect, or when a favorite action is rejected.
- Any database or durable persistence: sessions and favorites live only in
  server memory and are lost when the backend restarts.
- Session expiry or timeout, refresh tokens, or a "remember me" choice beyond
  the reload persistence above.
- Account management: profile editing, email change, account deletion, or
  merging/migrating favorites between emails.
- Managing other sessions of the same email (listing or revoking them) and any
  live synchronization between concurrent sessions.
- Security hardening: rate limiting, brute-force protection, CSRF protection,
  or proof of email ownership — the email address alone identifies the user.
- Guest favorites collected while signed out, and their transfer into a user's
  list at login.
- Changes to search, genre filtering, pagination, the TVmaze interaction and
  caching, toasts, the optimistic toggle (feature 006), soft removal and
  deferred refresh (feature 005), or URL state sync (feature 004) beyond what
  hiding the favorite controls requires.

## Technical limitations

- The backend is Express 5 with `express` as its only runtime dependency
  (`server/package.json`); there is no session, cookie or token middleware
  today. How the session travels with a request (cookie vs. a token in a
  header) is a decision for the plan phase, and any added dependency must
  respect the "plain in-memory objects, no database" constraint.
- Favorites live in one shared plain object `favorite: Record<number, Show>`
  keyed by the TVmaze show id (`server/routes/favorites/storage.ts`), served by
  `POST /api/favorites`, `DELETE /api/favorites/:id`, `GET /api/favorites/count`
  and `GET /api/favorites?page=` with no notion of an owner. Per-user storage
  must keep the plain-object approach; the exported `favorite` object is also
  the reset seam used by `server/tests/app.favorites.test.ts`, so that seam's
  shape changes with this feature.
- The shared frontend request layer (`web/src/api/request.ts`) sets headers only
  when a JSON body is present and has no support for auth headers or request
  credentials. If the session travels as a header, this layer must be extended —
  and every Task must keep using it, since `docs/architecture.md` forbids
  per-endpoint API modules and direct `fetch` in Tasks. A mechanism the browser
  attaches by itself (a same-origin cookie) needs no change here.
- Nothing in `web/src` reads or writes `localStorage`/`sessionStorage` today,
  and feature 003 excluded client-side persistence for favorites data. Keeping
  the session across a browser reload needs either a backend-issued cookie or
  client-side storage of the session credential — which one is a plan-phase
  decision; authoritative favorites data must still not be stored on the client.
- The app has no global header or navigation: `web/src/App/App.tsx` renders only
  the two routes (`/`, `/favorites`) plus the Toaster. The sign-in modal, the
  sign-in entry point, the email display and the Logout action are new UI and
  are subject to the design system workflow (`design/ScreenScout-design.pen` and
  `web/src/styles/tokens.css` are the sources of truth). The modal adds no route,
  so those two routes stay the app's whole URL surface, and `tokens.css` already
  carries `--scrim` and `--radius-modal` — no new token is expected.
- The favorites Entity stores the backend `{ count, ids }` summary verbatim and
  derives the count from the mirrored ids (`selectFavoritesCount`), and the
  optimistic overlay of feature 006 assumes those ids belong to the current
  user. Sign-out and user switch must not leave another user's ids, pending
  toggles or list snapshot in the Entity.
- The favorite controls are rendered by components shared between both pages and
  both layouts (`ShowList`, `ShowCard`, `ShowRowCard`, `FavoriteButton`,
  `FavoritesCountButton`); hiding them for signed-out users must not change
  rendering for signed-in users.
- Existing tests encode the current unauthenticated shared-list behavior and
  must be revised with the feature: the frontend suites under
  `web/src/pages/HomePage/tests/` and `web/src/pages/FavoritesPage/tests/`,
  `server/tests/app.favorites.test.ts`, and the Playwright specs and helpers in
  `e2e/` (for example `e2e/favorites-helpers.js` clears favorites through
  `GET /api/favorites/count` with no credentials). AGENTS.md mandates a
  test-first workflow.
- The E2E harness runs one real backend on port 3001 whose in-memory store is
  shared by parallel Playwright workers; per-user separation adds a natural key,
  but specs must still avoid interleaving writes for the same email.
- The backend has no push channel, so two concurrent sessions of the same email
  see each other's changes only on their next fetch.

## Acceptance Criteria

- [x] The app has a sign-in modal an unauthenticated user can open from the
      sign-in entry point, containing exactly one input (email), a submit action
      and a dismiss affordance; no password field is rendered and no login route
      exists.
- [x] Submitting a valid email starts a session through the backend, after which
      the modal closes and the app displays that email as the current user
      together with a Logout action.
- [x] Submitting an empty value or a value that is not an email starts no
      session, shows an error message in the modal and keeps the modal open.
- [x] Dismissing the modal without submitting closes it and leaves the app
      signed out.
- [x] Clicking Logout ends the session on the backend; the app then shows no
      email, no Logout action and no favorite controls.
- [x] Reloading the browser while signed in keeps the same email displayed and
      the same favorites visible, without requiring another login.
- [x] An unauthenticated user can search, filter by genre and paginate results
      exactly as today, and `GET /api/search` requires no authentication.
- [x] While unauthenticated, no heart buttons are rendered on show cards in
      either the desktop or the mobile layout, and the HomePage favorites-count
      button is not rendered.
- [x] While unauthenticated, navigating to the Favorites page renders no
      favorites list and lands on the HomePage, without opening the sign-in
      modal.
- [x] While signed in, clicking a heart adds or removes the show in that user's
      favorites only: the backend stores it under that email, and the heart
      state, the favorites count and the Favorites page reflect it.
- [x] Favorites added by one email are absent from another email's count, heart
      states and Favorites page list after the second email logs in.
- [x] After logging out and logging in again with the same email, the count, the
      heart states and the Favorites page list match what that email had before
      logout, while the backend process keeps running.
- [x] After logout, no favorites data of the previous user is displayed anywhere
      in the app (no stale ids, count or list).
- [x] An add or remove request that does not identify a signed-in session is
      rejected by the backend with an error response (not a success) and changes
      no favorites list.
- [x] Users, sessions and favorites are stored in plain in-memory objects on the
      backend; no database or file persistence is introduced.
- [x] Restarting the backend clears all sessions and favorites: a previously
      signed-in user must log in again, and their earlier favorites are gone.
- [x] `npm run typecheck`, `npm run lint`, `npm run test` and
      `npm run test:e2e` pass, with the previously shared-list tests revised and
      new tests covering login, logout, session persistence across reload, and
      per-user favorites separation.
