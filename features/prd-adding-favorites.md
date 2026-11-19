# PRD: Adding Favorites

**Date**: 2026-11-19
**Status**: Draft

## Purpose

Users can mark shows with a heart, but favorites currently live only in the
browser and provide no feedback, no visible count, and no paginated list. This
feature makes the backend the single source of truth for favorites and
completes the user-facing flow: heart toggle with toast confirmation, a
favorites-count button on the HomePage, and a paginated Favorites page whose
back button restores the HomePage search state.

## User Scenarios

- User clicks the heart on a show that is not a favorite -> the backend adds
  the show to favorites, the heart shows the favorite state, and a toast
  confirms the addition.
- User clicks the heart on a favorited show -> the backend removes the show,
  the heart shows the non-favorite state, and a toast confirms the removal.
- User views the HomePage -> a button displays the current number of favorite
  shows.
- User clicks the favorites-count button -> the app navigates to the Favorites
  page.
- User views the Favorites page -> favorite shows are listed 3 per page with
  pagination controls.
- User removes a show on the Favorites page -> the show disappears from the
  list, the pagination and the HomePage count update, and a toast confirms the
  removal.
- User clicks the back button on the Favorites page -> the app returns to the
  HomePage with the search query, genre filter, active page, and the
  corresponding results restored.

## In scope

- Migration of all favorites logic (add, remove, list, count) to the Express
  backend: the backend becomes the single source of truth, and the existing
  client-side-only favorites storage is replaced.
- Backend in-memory favorites storage as a plain object (`const favorite = {}`)
  keyed by the TVmaze show id, holding the favorited show data; no database.
- A backend API the frontend uses to add a favorite, remove a favorite, fetch
  the paginated favorites list, and fetch the favorites count.
- The heart control on each show card (existing UI) wired to the backend: a
  click adds a non-favorite show and removes a favorited show; the heart state
  of every rendered show reflects the backend favorites list.
- A toast notification on successful add and on successful removal, with
  distinct messages, disappearing automatically without user interaction.
- A favorites-count button on the HomePage that displays the current number of
  favorite shows, keeps the count up to date after every add/remove, and
  navigates to the Favorites page on click.
- Favorites page pagination: favorite shows listed 3 per page — the same page
  size as search results — with pagination controls reflecting the total
  number of favorites; the existing empty state is preserved.
- A back button on the Favorites page that navigates to the HomePage.
- HomePage state restoration when returning from the Favorites page within the
  same app session: the search input text, the selected genre filter, the
  active page, and the corresponding results page.
- Automated tests for the new behavior: backend unit/integration tests
  (Vitest + supertest), frontend tests (Vitest), and Playwright E2E coverage
  of the favorites flow.

## Out of scope

- Persistent storage of any kind (database, file, localStorage): favorites
  live only as long as the backend process runs.
- User accounts, authentication, or per-user favorites separation — there is a
  single shared favorites list per running backend.
- Restoring the HomePage state across a full browser reload or a backend
  restart.
- Search, genre filtering, or sorting on the Favorites page — plain pagination
  only.
- Refreshing or revalidating stored favorite show data against TVmaze after
  the show was favorited.
- Changes to the existing global navigation (the Home/Favorites nav links stay
  as-is); the count button is added to the HomePage only.
- Dedicated error-handling UX for failed favorite operations beyond what the
  app already provides for failed requests.

## Technical limitations

- The backend is Express 5 (TypeScript ESM run with tsx, port 3001) and the
  browser calls `/api` endpoints only; a new favorites route must follow the
  established pattern (own folder under `server/routes/`, mounted in
  `server/app.ts`).
- Favorites live in the server process memory (`const favorite = {}`): they
  are lost on server restart and are not shared between multiple server
  instances. This is inherent to the required plain-object storage.
- The stored show data is a snapshot from the moment it was favorited; the
  Favorites list and count are served from this storage without calling
  TVmaze.
- There is no user identification: every client of the same backend sees and
  modifies the same favorites list.
- The HomePage search state (query, genre, page) currently lives only in the
  HomePage Presenter's local state and is discarded when the page unmounts;
  restoring it after in-session navigation requires keeping this state beyond
  the Presenter's lifetime.
- The frontend has no toast/notification component yet (the shared ui-kit is
  empty); one must be created following the documented component organization
  and styling rules.
- The app follows the documented Simple Architecture (View/Presenter/Task/
  Entity): favorites fetching and mutations must go through Tasks and the API
  layer, and application data through the Redux Entity — the backend migration
  must not bypass these rules.
- The visual design source of truth is the pen.dev canvas
  (`design/ScreenScout-design.pen`); the new visual elements (toast, count
  button, favorites pagination) are subject to the design system workflow.
- The repo mandates a test-first workflow (AGENTS.md): Vitest + supertest for
  both workspaces and Playwright E2E against the local TVmaze stub.

## Acceptance Criteria

- [ ] Clicking the heart on a non-favorite show sends an add request to the
      backend, after which the backend favorites storage contains the show.
- [ ] Clicking the heart on a favorited show sends a remove request to the
      backend, after which the backend favorites storage no longer contains
      the show.
- [ ] The heart state of every rendered show matches the backend favorites
      list, including after a new search, a genre change, or a page change.
- [ ] All favorites add/remove/list/count operations are performed by the
      Express backend; no authoritative favorites data is stored on the client
      (the previous client-only favorites storage is replaced).
- [ ] The backend stores favorites in a plain in-memory object
      (`const favorite = {}`) keyed by show id; no database or file
      persistence is involved.
- [ ] A successful add shows a toast confirming the addition; a successful
      removal shows a toast with a distinct message confirming the removal;
      both disappear automatically without user interaction.
- [ ] The HomePage displays a button showing the current number of favorite
      shows; the displayed count updates after every add and remove.
- [ ] Clicking the count button navigates to the Favorites page.
- [ ] The Favorites page lists favorite shows 3 per page with pagination
      controls reflecting the total number of favorites; the empty state still
      renders when there are no favorites.
- [ ] Removing a show on the Favorites page updates the list and the
      pagination, and is reflected in the HomePage count button.
- [ ] The Favorites page has a back button that navigates to the HomePage.
- [ ] After leaving the HomePage with a search query, a genre filter, and a
      page number set, returning from the Favorites page within the same app
      session shows the search input text, the selected genre, the active
      page, and the corresponding results page restored.
- [ ] The backend favorites endpoints (add, remove, paginated list, count) are
      covered by automated tests, and the end-to-end favorites flow (toggle
      with toasts, count navigation, favorites pagination, back-navigation
      restoration) passes in the Playwright suite.
- [ ] `npm run typecheck`, `npm run lint`, `npm run test`, and
      `npm run test:e2e` pass.
