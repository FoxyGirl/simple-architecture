# PRD: Shows Entity (Redux Store) and Fetch Tasks

**Date**: 2026-11-18
**Status**: Draft

## Purpose

The current list of shows lives in local React state inside the HomePage
presenter, and the presenter fetches data directly, which contradicts the
documented Simple Architecture. This feature introduces an Entity (a Redux
Toolkit store) that owns the current shows data and Tasks that fetch and
update this data through a dedicated API layer, so the implementation follows
the documented separation of responsibilities between View, Presenter, Tasks,
Entity, and API.

## User Scenarios

- User submits a search query -> a Task fetches the result page through the
  API layer and updates the store; HomePage renders the shows and result
  metadata read from the store.
- User selects a genre or switches page -> the Presenter passes the query,
  genre and page to the Task as explicit arguments; the store is updated with
  the new result page and the UI re-renders.
- User retries a failed request -> the Task re-runs the fetch through the API
  layer and updates the store on success; the existing error state is shown
  while the request fails.
- A new request supersedes an in-flight one -> the superseded response does
  not overwrite the newer data in the store or on screen.
- Developer points the app at a different backend endpoint through the
  configured base URL -> all API requests follow the new endpoint without
  code changes in Presenter, Tasks, or Entity.

## In scope

- Adding Redux Toolkit and its React bindings as `web/` dependencies,
  creating the Redux store, and wiring it at the application root so
  Presenters can consume it through selectors.
- A shows Entity (slice) storing the current search result — the list of
  shows plus the response metadata the UI renders (`page`, `pageCount`,
  `totalCount`, `genres`) — with actions, reducers, selectors, and the types
  of its state and data models; independent of React components, Views,
  Presenters and Tasks.
- Request status (`idle`/`loading`/`success`/`error`) and the genre/page
  selection remain presenter-managed presentation state, per
  `docs/architecture.md` (the Entity MUST NOT contain UI-related state).
- Tasks implementing the shows-fetching business operations (search submit,
  genre/page selection change, retry): plain TypeScript functions placed in
  the documented `logic/tasks/` folder, calling the API layer for data
  fetching, updating the store via `store.dispatch`, receiving all required
  data through explicit function arguments, and returning the operation
  result to the Presenter when needed.
- Completing the API layer (`web/src/api/`): a configurable base URL for the
  external server whose default preserves the current same-origin `/api`
  behavior; centralized request configuration, response handling and error
  handling; no low-level HTTP details exposed to Tasks; no imports from the
  `server/` directory.
- Rewiring the HomePage to the new layers: the Presenter reads shows data
  from the store through selectors and initiates fetching only through Tasks;
  the direct-fetch machinery (`useShowsDataFetching`) is removed; the
  Presenter and Tasks are moved into the documented layout
  (`logic/useHomePage.ts`, `logic/tasks/`); all existing user-visible
  behavior is preserved (loading/error states, abort of superseded requests,
  current-query deduplication, genre/page reset rules).
- Automated tests for the new Entity, Tasks and API behavior following the
  repository test conventions (colocated `tests/` folders, Vitest), with the
  existing unit/integration and Playwright E2E suites still passing.

## Out of scope

- Visual or UX changes; the search/filter/pagination user flow and the design
  stay as-is.
- Backend changes: the Express server, its routes, caching and TVmaze
  interaction remain as delivered by the backend feature.
- Storing request status, the search query, the genre/page selection or any
  other UI-related state in the Entity.
- Frontend caching or persistence of shows data (localStorage, sessionStorage
  or store persistence); the backend continues to own response caching.
- New features that consume the store (e.g. a show details page).
- Mandating a specific third-party HTTP client library; the API layer
  encapsulates the HTTP mechanism, and the choice of mechanism is an
  implementation decision.

## Technical limitations

- `@reduxjs/toolkit` and `react-redux` are not currently dependencies of the
  `web/` workspace and must be added in versions compatible with React 19
  and the strict TypeScript 6 configuration.
- `docs/` defines the Entity/Task/API responsibilities but does not prescribe
  a concrete directory for the Redux store; the placement must be derived
  from the documented organization rules (ownership, `index.ts` barrels,
  import aliases) and is an open decision at implementation time, not an
  existing convention.
- The current API module (`web/src/api/shows.ts`) hardcodes the relative URL
  `/api/search`, and both `npm run dev` and the Playwright E2E flow rely on
  the Vite dev proxy to `http://localhost:3001`; the configurable base URL
  must keep these flows working with its default value.
- Behavior currently tied to the presenter-level fetch machinery — aborting
  superseded in-flight requests, `isCurrentQuery` deduplication, resetting
  genre/page on a new search and page on genre change — must survive the
  move into Tasks; the existing suites (`HomePage.test.tsx`,
  `searchFlow.test.tsx`, `searchRendering.test.tsx`) and the E2E specs verify
  it.
- Source files MUST NOT exceed 120 lines (ESLint `max-lines`), which applies
  to the new store, slice, selector and task modules.
- TypeScript strict mode (`noUncheckedIndexedAccess`,
  `verbatimModuleSyntax`, `erasableSyntaxOnly`): object shapes are `type`
  aliases declared in `types.ts` files next to their owners, and imports
  carry no file extensions.

## Acceptance Criteria

- [ ] The `web/` workspace depends on Redux Toolkit and `react-redux`; a
      Redux store is created and provided at the application root, and
      `npm run typecheck`, `npm run lint`, `npm run test` and
      `npm run test:e2e` pass.
- [ ] The Entity stores the current search result — the shows list plus
      `page`, `pageCount`, `totalCount` and `genres` — and exposes actions,
      reducers, selectors and state types as its public API.
- [ ] The Entity contains no request status or other UI-related state, no
      presentation logic, and no dependencies on Views, Presenters or Tasks.
- [ ] After a successful search, genre change or page change, the shows
      rendered by HomePage are read from the store through selectors used by
      the Presenter (verifiable in tests or via store inspection).
- [ ] Shows fetching is implemented as Task functions — plain TypeScript, no
      React hooks — located in the HomePage `logic/tasks/` folder; the
      Presenter initiates fetching only by invoking Tasks and never calls the
      API layer or `fetch` directly.
- [ ] Tasks perform HTTP communication only through the API layer (no `fetch`
      or request building inside task files) and update the store only via
      `store.dispatch` (no `store.getState()` and no selector usage inside
      tasks).
- [ ] Tasks receive all required application data (query, genre, page)
      through explicit function arguments.
- [ ] The API layer uses a configurable base URL: changing the configured
      value redirects all API requests to a different server without code
      changes in Presenter, Tasks or Entity (verifiable in tests).
- [ ] With the default configuration, the dev flow (`npm run dev` +
      `npm run server`) and the E2E flow are unchanged: browser requests
      still reach the Express backend and the existing Playwright specs pass.
- [ ] The API layer encapsulates request configuration, response handling
      and error handling; Tasks consume only its function interface, and no
      `web/` module imports from the `server/` directory.
- [ ] The HomePage Presenter lives at `logic/useHomePage.ts`, its Tasks at
      `logic/tasks/`, and the former direct-fetch helper
      (`useShowsDataFetching`) no longer exists.
- [ ] Existing user-visible behavior is preserved: loading and error states
      render as before, a new search resets genre and page, a genre change
      resets the page to 1, retry re-issues the current request, and a
      superseded in-flight request does not overwrite newer results.
- [ ] The new Entity, Tasks and API behavior are covered by automated tests
      placed in colocated `tests/` folders per the repository conventions.
