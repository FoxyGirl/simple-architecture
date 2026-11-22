# Plan: Email Authentication and User-Specific Favorites

**PRD:** features/007-prd-email-authentication-and-user-specific-favorites.md

**Date:** 2026-11-22

**Revision:** 2026-11-22 — the dedicated login page became a sign-in modal at
user request (see the PRD revision): no login route is added, the modal is an
App-level component opened from the account bar, and a signed-out navigation to
`/favorites` redirects to the HomePage without opening it. Phases 2-4 updated.

> **Approach.** Four phases, ordered so that no phase leaves the app degraded.
> Phase 1 is the tracer bullet: the backend alone learns to start, resolve and
> end an email-only session (`POST /api/auth/login`, `POST /api/auth/logout`,
> `GET /api/auth/me`) — the frontend is untouched and everything still works.
> Phase 2 builds the frontend authentication core on those endpoints (session
> Entity, three auth Tasks, the sign-in modal, the account bar with the email
> and Logout, the boot restore that survives a reload); favorites still behave
> exactly as today because the backend still serves one shared list. Phase 3
> gates the favorites UI on the session (hearts and the count button hidden
> while signed out, the Favorites route guarded, a sign-in entry point shown);
> the backend still accepts unauthenticated writes, so nothing breaks. Phase 4
> is the backend half of the favorites requirement: storage re-keyed per email
> and every favorites endpoint requiring a session — the frontend already
> authenticates, so this is the last piece, and the phase closes with a
> re-check of every PRD acceptance criterion. Backend and frontend work never
> share a phase.
>
> **Session mechanism (recorded decision, deferred to this plan by the PRD).**
> An HttpOnly session cookie issued by the backend: `POST /api/auth/login`
> answers `Set-Cookie: <name>=<token>; Path=/; HttpOnly; SameSite=Lax` and the
> backend keeps `sessions: Record<token, email>` in a plain object. A session
> cookie (no `Max-Age`) survives a browser reload — the only persistence the
> PRD requires — and disappears with the browser, matching the in-memory
> backend whose sessions and favorites die on restart anyway. Consequences
> that make this the cheapest correct option: the browser attaches the cookie
> to every same-origin `/api` request on its own (`fetch` defaults to
> `credentials: 'same-origin'`, and the Vite dev proxy keeps `/api`
> same-origin), so **`web/src/api/request.ts` needs no change, no favorites
> Task changes, and feature 006's optimistic flow is untouched**. The rejected
> alternative — a bearer token in `localStorage` sent as an `Authorization`
> header — would have required extending the shared request layer, a
> client-side credential store (PRD 003 excludes client-side authoritative
> data, and nothing in `web/src` uses web storage today) and a change to every
> Task that composes a favorites request. No new dependency: the `Cookie`
> header is parsed and `Set-Cookie` built by a small helper in `server/auth/`
> (`express` stays the only runtime dependency; `cookie-parser` and session
> middleware are deliberately not added).
>
> **Testing.** Red -> green per AGENTS.md: every phase writes its automated
> tests before the implementation. E2E placement follows the existing
> single-writer rule: flows that mutate favorites stay in `favorites.spec.js`
> as flow modules (the new `e2e/favorites-users.js` joins it in Phase 4),
> while the flows that write no favorites — login, logout, reload persistence,
> the signed-out UI, the route guard — live in a new parallel-safe
> `e2e/auth.spec.js` with `e2e/auth-helpers.js` locators. Backend suites
> authenticate through `POST /api/auth/login` and replay the returned
> `Set-Cookie` value; the `request` fixture shares the browser context's cookie
> jar, and where it does not, the helper replays the header explicitly. The
> PRD's "restarting the backend clears all sessions and favorites" criterion
> cannot restart the process inside a suite, so it is covered by clearing the
> exported in-memory seams (the same technique `server/tests/app.favorites.test.ts`
> already uses) plus the frontend's 401-on-restore path. Phase 1 has no UI, so
> no E2E is feasible there — recorded rather than skipped silently.
>
> **Key decisions (recorded):**
>
> - **Session Entity.** `web/src/store/session/` holds the signed-in email as
>   `{ email: string | null }` — backend-owned data stored verbatim
>   (`replaceSession`, `clearSession`) with `selectSessionEmail` and
>   `selectIsAuthenticated`. The restore's in-flight status is transient
>   operation state and stays in the App presenter, never in Redux
>   (`docs/architecture.md`).
> - **Favorites Entity reset.** `favoritesSlice` gains `clearFavorites()`
>   restoring the existing `EMPTY_STATE` (ids, pendingToggles, shows,
>   totalCount). The login, logout and failed-restore Tasks dispatch it, so no
>   ids, count, pending overlay or list snapshot of a previous user can
>   survive a user switch — the PRD's "no stale ids, count or list".
> - **Boot restore.** `App/logic/useApp.ts` runs `restoreSession()` once on
>   mount and exposes prepared flags (`isSessionReady`, `isAuthenticated`) plus
>   the modal's open state. Until the restore settles the app renders the
>   signed-out UI on `/` but the guarded route waits, so a signed-in hard reload
>   of `/favorites` never bounces to the HomePage.
> - **Route guard at App level.** `App.tsx` already owns `<Routes>`, so the
>   `/favorites` element becomes `<FavoritesPage />` when authenticated and
>   `<Navigate to="/" replace />` when not — flags arrive prepared from the
>   presenter, the View derives nothing. No route is added: `/` and
>   `/favorites` stay the app's whole URL surface, and the redirect does not
>   open the modal (recorded user decision).
> - **Sign-in modal, not a page.** One App-level `App/AuthModal/` — a sibling of
>   `Toaster` and `AccountBar` under the same single-owner rule — is the single
>   host, rendered by `App.tsx` only while open. The open state is transient UI
>   state owned by `useApp` (`isAuthModalOpen`, `openAuthModal`,
>   `closeAuthModal`) and never lives in Redux (`docs/architecture.md`). The
>   account bar's Sign in action opens it; a successful sign-in closes it in
>   place with no navigation, so the user stays on the route they were on. The
>   modal is a dialog (`role="dialog"`, `aria-modal`, labelled by its heading),
>   dismisses through its close button, the Escape key and a backdrop click, and
>   focuses the email field on open — the focus-handling precedent is
>   `useSearchDraft`. Dismissing it changes no session state. The scrim and the
>   panel radius use the existing `--scrim` and `--radius-modal` tokens.
> - **Auth Task placement.** Each Task has exactly one consumer, so each lives
>   in that component's own `logic/tasks/` (component-organization rule):
>   `App/logic/tasks/restoreSession.ts`, `App/AccountBar/logic/tasks/logout.ts`,
>   `App/AuthModal/logic/tasks/signIn.ts`. No shared `tasks/` folder is
>   created. All three keep the Task contract: plain functions, explicit
>   arguments, `store.dispatch` only, never `getState()`/selectors, HTTP
>   through `buildApiUrl`/`requestJson`, discriminated `{ status }` outcome.
> - **Account bar.** A new App-level `App/AccountBar/` (sibling of
>   `App/Toaster/`, the same single-owner rule) renders on every route: a
>   "Sign in" action while signed out — the PRD's sign-in entry point — and the
>   current user's email with a Logout action while signed in. Its presenter
>   reads `selectSessionEmail` and runs the logout Task; the Sign in handler
>   arrives as a prop from App (the modal's owner) and is exposed prepared, so
>   the account bar owns neither navigation nor modal state.
> - **Hiding the favorite controls** follows the feature-006 pending-registry
>   precedent: `useShowList` reads `selectIsAuthenticated` and passes
>   `canFavorite` to `ShowCard`/`ShowRowCard`, which render `FavoriteButton`
>   only when it is true; `ShowListProps` gains no injected prop, so both pages
>   and both layouts gate from the same Entity. The HomePage count button is
>   prepared by `useShowFavorites` as a `favoritesButton` payload that is
>   `null` while signed out and `{ count, onClick }` while signed in, so the
>   View only composes. `useShowFavorites` also runs `syncFavoritesSummary`
>   only for a signed-in email, with the email in the effect dependencies so
>   login and logout re-sync.
> - **Email handling.** The backend trims and lowercases the address, so
>   `A@B.com` and `a@b.com` are one user and one favorites list; validation is
>   a minimal shape check (`^[^\s@]+@[^\s@]+\.[^\s@]+$`) because the PRD
>   excludes ownership verification. An empty or non-email value answers 400
>   `{ error }`, which the modal renders as its inline message and stays open
>   for (the PRD requires the message in the modal, so no toast); the modal's
>   presenter also checks the same shape with a pure local helper before
>   invoking the Task, so an invalid submit sends no request.
> - **Backend enforcement without request augmentation.** `@server/auth`
>   exposes `resolveSessionEmail(req)` reading the cookie header, and the
>   favorites route keeps a private `requireEmail(req, res)` guard that answers
>   401 `{ error }` and short-circuits. No `Express.Request` augmentation:
>   `erasableSyntaxOnly` forbids namespaces, and all four favorites endpoints
>   require a session (reads included — the signed-out UI never calls them).
>   `GET /api/search` stays unauthenticated.
> - **Per-email favorites storage** keeps the plain-object approach:
>   `favoritesByEmail: Record<string, Record<number, Show>>` in
>   `server/routes/favorites/storage.ts`, helpers taking the email first, an
>   unknown email yielding the empty summary and one empty page. Logout never
>   deletes the list — that is exactly what preserves favorites across logout
>   and a later login. The exported reset seam changes shape (the PRD flags
>   this) and its two consumers are updated with it. The recorded integer-key
>   iteration-order decision stays valid per email.
> - **Response envelopes are unchanged**: login and `me` answer
>   `{ email: string }`, logout `{ email: null }` (one `AuthSession` type in
>   both workspaces), failures `{ error: string }` as today, and the favorites
>   endpoints keep answering `{ count, ids }` and the list page byte-identically
>   — which is why no frontend Task changes in Phase 4.
> - **Design.** The sign-in modal, the account bar and the signed-out hero slot
>   are new visual elements and go through the design system workflow: existing
>   tokens only (`--surface`, `--surface-2`, `--border`, `--accent`,
>   `--accent-hover`, `--text-*`, `--radius-input`, `--radius-btn`,
>   `--radius-modal`, `--scrim`, `--space-*`, `--focus-ring`, `--font-display`,
>   `--font-body`), CSS Modules with regenerated `.d.ts`. `src/ui-kit/` is empty
>   (`.gitkeep`), so there are no primitives to reuse — no dialog, field or
>   button component exists yet, and the modal builds its own. Mirror the new
>   components on the pen.dev canvas through the MCP tools; the canvas currently
>   reports no open document and plans 003/005/006 recorded a plan-usage limit,
>   so if it is still blocked, record the deferral instead — the `.pen` file is
>   never touched outside the MCP design tools. No new token is expected; if one
>   becomes necessary, the canvas variable and `web/src/styles/tokens.css` are
>   updated together.
>
> **Constraints carried through every phase:** no database and no durable
> persistence — plain in-memory objects only; no new runtime dependency in
> `server/` (`express` stays alone) or in `web/`; source files <= 120 lines
> (ESLint `max-lines`, test files included — split along the established seams
> rather than compress); TypeScript strict (`noUncheckedIndexedAccess`,
> `verbatimModuleSyntax`, `erasableSyntaxOnly`); object shapes as `type` aliases
> in the owning `types.ts`; extensionless import specifiers; `~` and `@server`
> aliases for cross-folder imports; `index.ts` barrels publishing Views only;
> Views never touching the store or the router; Tasks plain functions with
> explicit arguments and `store.dispatch` only; navigation and toasts at
> Presenter level; CSS Modules + `npm run css-types` after every CSS change +
> `clsx` object form in base-then-modifier order + design tokens; the React
> memoization rules (`rules/react-memoization.md`) for every hook added or
> reworked; features 004/005/006 behavior preserved (URL state sync, soft
> removal and deferred refresh, optimistic toggle with its pending overlay and
> disabled heart).

## Implementation Phases

### Phase 1: Backend email sessions

**Goal:** The backend can start, resolve and end an email-only session: a
login endpoint that validates the address and issues an HttpOnly session
cookie, a `me` endpoint that resolves it, and a logout endpoint that
invalidates it — all backed by a plain in-memory token -> email object. The
frontend is untouched, the favorites and search endpoints behave exactly as
before, and every gate stays green. Tracer bullet: the session every later
phase builds on.

**Affects:** backend

**Tasks:**

- [x] Write the session-module suite first (red),
      `server/auth/tests/session.test.ts`: `createSession(email)` returns a
      non-empty token and records it; `resolveSessionEmail` maps a known token
      back to the email and returns `null` for an unknown or empty one;
      `destroySession` invalidates it and is a no-op the second time; two
      sessions for the same email get distinct tokens; `normalizeEmail` trims
      and lowercases; `isEmail` accepts `a@b.co` and rejects `''`, `'a'`,
      `'a@b'`, `'a b@c.co'`; `parseSessionCookie` and `sessionCookieHeader`
      round-trip the token, including a header carrying other cookies and a
      missing header.
- [x] Write the app-level auth suite first (red), `server/tests/app.auth.test.ts`
      (supertest, with the mocked-`fetch` pattern of `app.favorites.test.ts`
      proving authentication never calls TVmaze): `POST /api/auth/login` with
      `{ email }` answers 200 `{ email }` normalized, with a `Set-Cookie`
      carrying the token plus `HttpOnly`, `Path=/`, `SameSite=Lax` and no
      `Max-Age`; an empty and a non-email value answer 400 `{ error }` with no
      `Set-Cookie`; `GET /api/auth/me` answers 200 `{ email }` when the cookie
      is replayed and 401 `{ error }` without it; `POST /api/auth/logout`
      answers 200 `{ email: null }`, clears the cookie and invalidates the
      token (`me` then 401); logout is idempotent; a login after a logout
      issues a working token again.
- [x] Implement `server/auth/` as a shared backend module with its own barrel:
      `session.ts` (`sessions: Record<string, string>` keyed by a
      `node:crypto` `randomUUID` token, `createSession`, `resolveSessionEmail`,
      `destroySession`), `cookie.ts` (the cookie-name constant,
      `parseSessionCookie`, `sessionCookieHeader`, `clearedSessionCookie`),
      `email.ts` (`normalizeEmail`, `isEmail`), `index.ts` re-exporting the
      public API — each file <= 120 lines, split along these seams rather than
      compressed.
- [x] Implement `server/routes/auth/`: `types.ts` declaring the `AuthSession`
      type (`{ email: string | null }`), `auth.ts` (the three handlers; login
      normalizes and validates the address and answers 400 `{ error }`
      otherwise, logout destroys the resolved session and always answers
      `{ email: null }`, `me` answers 401 `{ error }` when no session
      resolves), `index.ts` publishing the router; re-export from
      `server/routes/index.ts` and mount with `app.use('/api', authRouter)` in
      `server/app.ts` — the single composition point, no handler defined there.
- [x] Add the restart-equivalence cases (red -> green): clearing the exported
      `sessions` seam makes a previously issued token resolve to `null`, makes
      `GET /api/auth/me` answer 401, and a fresh login works again — the
      automated stand-in for the PRD's "restarting the backend clears all
      sessions".
- [x] Verify: `npm run typecheck`, `npm run lint`, `npm run test`,
      `npm run test:e2e` and `npm run build` green; `web/` has no diff;
      `server/package.json` still lists `express` as its only runtime
      dependency; every `/api/favorites` endpoint still answers without a
      session (enforcement is Phase 4).

**Tests:**

- [x] New `server/auth/tests/session.test.ts`: token lifecycle, cookie
      round-trip, email normalization and validation (red -> green).
- [x] New `server/tests/app.auth.test.ts`: the three endpoints, cookie
      attributes, 400/401 error envelopes, logout idempotence, no TVmaze call
      (red -> green).
- [x] Restart-equivalence cases built on the exported session seam (red ->
      green).
- [x] All pre-existing suites stay green untouched: `app.favorites.test.ts`,
      `app.search.test.ts`, `app.test.ts`, `routes/favorites/tests/storage.test.ts`,
      `routes/search/tests/shows.test.ts`, `cache/tests/`, `pagination/tests/`,
      every web suite, and all 21 Playwright tests. No E2E is added in this
      phase: there is no UI for it yet (recorded).

**When ready:**

`POST /api/auth/login`, `POST /api/auth/logout` and `GET /api/auth/me` work
against a plain in-memory token store, issuing and clearing an HttpOnly
session cookie; invalid addresses are rejected with the existing `{ error }`
envelope; clearing the store invalidates every token; the running app and
every existing suite behave exactly as before, with `web/` untouched.

**Acceptance Criteria:**

- [x] `POST /api/auth/login` with a valid email creates a session in a plain
      in-memory object and answers `{ email }` with an HttpOnly, `Path=/`,
      `SameSite=Lax` session cookie; an empty or non-email value answers 400
      `{ error }` and creates no session.
- [x] `GET /api/auth/me` answers `{ email }` for a valid session cookie and 401
      `{ error }` without one — including after the session store is cleared.
- [x] `POST /api/auth/logout` ends the session on the backend (the token no
      longer resolves), clears the cookie and is idempotent.
- [x] Sessions live in a plain object; `server/package.json` gains no
      dependency and no database or file persistence is introduced.
- [x] `GET /api/search` and all four `/api/favorites` endpoints behave exactly
      as before this phase; `web/` has no diff.
- [x] `npm run typecheck`, `npm run lint`, `npm run test`,
      `npm run test:e2e` and `npm run build` pass.

### Phase 2: Frontend authentication core

**Goal:** A user opens the sign-in modal from the account bar, signs in with an
email, sees that email with a Logout action on every route, signs out, and stays
signed in across a browser reload because the app restores the session from the
backend on boot. Sign-in, logout and a failed restore keep the session Entity
and the favorites Entity consistent, and dismissing the modal changes nothing.
Favorites behavior is otherwise unchanged in this phase: the controls still
render for everyone and the backend still serves one shared list.

**Affects:** frontend

**Tasks:**

- [x] Write the E2E auth flows first (red): new `e2e/auth.spec.js` with
      `e2e/auth-helpers.js` locators (Sign in entry point, modal, email input,
      submit action, dismiss control, account-bar email, Logout) — opening the
      modal from Sign in and submitting a valid email closes it, shows the email
      in the account bar and hides Sign in; logout returns to the Sign in state
      and shows no email; `page.reload()` after login still shows the email
      without another login; an empty and a non-email submit render an inline
      error inside the still-open modal, create no session and show no
      account-bar email; dismissing the modal (close control, Escape, backdrop)
      closes it and leaves the app signed out. The spec writes no favorites, so
      it runs in parallel with the other specs (the single-writer rule of
      `favorites.spec.js` is unaffected).
- [x] Write the Entity, Task and presenter suites first (red):
      `store/session/tests/sessionEntity.test.ts` (`replaceSession`,
      `clearSession`, `selectSessionEmail`, `selectIsAuthenticated`, and the new
      `clearFavorites` resetting ids, pendingToggles, shows and totalCount);
      `App/logic/tasks/tests/restoreSession.test.ts` (200 -> `replaceSession`;
      401 or network failure -> `clearSession` + `clearFavorites`, returned as
      `{ status: 'error' }` and never thrown);
      `App/AccountBar/logic/tasks/tests/logout.test.ts` (POST then both clear
      dispatches on success, no dispatch on failure);
      `App/AuthModal/logic/tasks/tests/signIn.test.ts` (POST `{ email }`,
      `replaceSession` + `clearFavorites` on success, an error outcome carrying
      the backend message on 400); `useAuthModal`, `useAccountBar` and `useApp`
      suites asserting their prepared public interface only, including the
      modal's open/close transitions and the submitting and error flags; and an
      `AuthModal/tests/` View suite for the dialog semantics, the single email
      input with no password field, the inline error and each dismiss path.
- [x] Implement the session Entity: `store/session/{types,sessionSlice,selectors,index}.ts`
      storing `{ email: string | null }` verbatim, registered in
      `store/store.ts` and exported through `store/index.ts`; add
      `clearFavorites()` to `store/favorites/favoritesSlice.ts` restoring the
      existing `EMPTY_STATE`, exported through the favorites and store barrels,
      with the slice and `types.ts` doc comments updated to describe the reset.
- [x] Add the shared auth shape `AuthSession = { email: string | null }` to
      `web/src/types.ts` (app-wide backend response shapes live there) and the
      auth Task result types to the `types.ts` of the folder owning each Task,
      reusing `FavoritesSummaryResult`'s discriminated-union style.
- [x] Implement the three auth Tasks, each in its single consumer's
      `logic/tasks/`: `restoreSession` (`GET /api/auth/me`; any failure
      dispatches the signed-out state), `logout` (`POST /api/auth/logout`;
      dispatches `clearSession` + `clearFavorites` only on success) and
      `signIn` (`POST /api/auth/login` with the trimmed address; dispatches
      `clearFavorites` + `replaceSession` on success) — all through
      `buildApiUrl`/`requestJson`, all mutating the store only via
      `store.dispatch`, all returning the discriminated outcome. No
      request-layer change: the browser attaches the session cookie itself.
- [x] Implement `App/AuthModal/` (dialog View with a single email input, a
      submit action, an inline error paragraph and a dismiss control — no
      password field; CSS Module built on `--scrim`, `--radius-modal` and the
      existing tokens; `logic/useAuthModal.ts` owning the draft, the submitting
      flag and the error message, validating through a pure `isEmail` helper in
      its own `utils/` before invoking the `signIn` Task, reporting success
      through `onSignedIn` and every dismiss path — Escape, backdrop click and
      the close control — through `onClose`; `constants.ts` for the messages;
      `index.ts` exporting the View only) and `App/AccountBar/` (View rendering
      the Sign in action while signed out and the email with a Logout button
      while signed in; `logic/useAccountBar.ts` reading `selectSessionEmail`,
      forwarding the `onSignIn` prop and running the logout Task). Run
      `npm run css-types` after every CSS module.
- [x] Wire App and the design system: `App/logic/useApp.ts` runs
      `restoreSession()` once on mount, owns the modal's open state and exposes
      the prepared `isSessionReady`/`isAuthenticated` flags together with
      `isAuthModalOpen`, `openAuthModal` and `closeAuthModal`; `App.tsx` renders
      `<AccountBar onSignIn={openAuthModal} />` above `<main>`, renders the
      modal only while open (a successful sign-in closes it through
      `closeAuthModal`), adds no route, and leaves `/` and `/favorites` as they
      are in this phase. Mirror the modal and the account bar on the pen.dev
      canvas through the MCP tools, or record the deferral if the plan-usage
      limit noted in plans 003/005/006 still applies.

> **Design-canvas record (2026-11-22).** The pen.dev MCP `get_app_state`
> still answers "A document needs to be open in the editor", so mirroring the
> modal and the account bar on the canvas is deferred. Their styling uses
> existing tokens only (`--surface`, `--surface-2`, `--border`, `--accent`,
> `--accent-hover`, `--text-*`, `--radius-input`, `--radius-btn`,
> `--radius-modal`, `--scrim`, `--space-*`, `--focus-ring`, `--font-display`,
> `--font-body`). No token was added, so `tokens.css` and the canvas variables
> stay in sync.

**Tests:**

- [x] New E2E `e2e/auth.spec.js`: modal open and dismiss, sign-in, logout,
      reload persistence, invalid and empty submits (red -> green).
- [x] New session Entity suite, including the `clearFavorites` reset (red ->
      green).
- [x] New Task suites for `restoreSession`, `logout` and `signIn` at the mocked
      request boundary (`~/test/api-mock` extended with the auth routes) (red ->
      green).
- [x] New presenter suites for `useAuthModal`, `useAccountBar` and `useApp`
      asserting their prepared interface, including the modal's open state (red
      -> green).
- [x] New `AuthModal` View suite: dialog semantics, one email input and no
      password field, the inline error, and the close/Escape/backdrop dismiss
      paths (red -> green).
- [x] All pre-existing suites stay green: every HomePage and FavoritesPage
      suite (they render pages directly and the favorites sync is still
      unconditional in this phase), the store, api and notification suites, all
      server suites and all existing Playwright flows.

**When ready:**

A user can open the sign-in modal, sign in with an email, see it with a Logout
action on every route, sign out, and stay signed in across a reload; dismissing
the modal changes nothing; an invalid address never starts a session and reports
inside the still-open modal; sign-in, logout and a failed restore leave the
session and favorites Entities consistent; favorite controls still render
exactly as before and every gate is green with `server/` unchanged beyond
Phase 1.

**Acceptance Criteria:**

- [x] The account bar's Sign in action opens a sign-in modal rendering exactly
      one input (email), a submit action and a dismiss control; no password
      field exists in the DOM and no login route is added (E2E + unit).
- [x] Submitting a valid email sends `POST /api/auth/login`, stores the returned
      email in the session Entity, closes the modal and displays the email in
      the account bar with a Logout action, with no navigation away from the
      current route (E2E + unit).
- [x] Submitting an empty or non-email value sends no request, starts no
      session, shows an error message inside the modal and keeps the modal open
      (unit + E2E).
- [x] Dismissing the modal — close control, Escape key or backdrop click —
      closes it and leaves the app signed out (unit + E2E).
- [x] Clicking Logout sends `POST /api/auth/logout`, clears the session and the
      favorites Entity, and the account bar returns to its Sign in state (unit +
      E2E).
- [x] Reloading the browser while signed in shows the same email without
      another login: the boot restore reads `GET /api/auth/me` (E2E).
- [x] A 401 or failed restore leaves the app signed out with an empty favorites
      Entity and shows no error toast at boot (unit).
- [x] No favorite control is hidden yet: every pre-existing frontend suite and
      Playwright flow passes unchanged, and `server/` has no diff beyond
      Phase 1.
- [x] `npm run typecheck`, `npm run lint`, `npm run test`,
      `npm run test:e2e` and `npm run build` pass.

### Phase 3: Frontend gating — favorites become a signed-in feature

**Goal:** While signed out the app renders no heart button on any card in
either layout, no HomePage favorites-count button and no favorites list, and
the Favorites URL redirects to the HomePage without opening the modal; a
sign-in entry point that opens the sign-in modal is visible. While signed in
everything renders and behaves exactly as after Phase 2, and a signed-in reload
of `/favorites` never bounces to the HomePage. After logout no favorites data
of the previous user is displayed anywhere.

**Affects:** frontend

**Tasks:**

- [x] Write the E2E guest flows first (red), extending `e2e/auth.spec.js` (or a
      sibling `e2e/auth-guest.js` if the file nears the 120-line budget): after
      a search as a signed-out user no favorites heart exists — neither
      `Add … to favorites` nor `Remove … from favorites` — at the default
      desktop viewport, and none after a resize to the mobile row card
      (`page.setViewportSize({ width: 900, height: 1000 })`);
      `View favorites (N)` is absent; the Sign in entry point is visible and
      opens the sign-in modal; `page.goto('/favorites')` lands on the HomePage
      with no favorites list rendered and no modal opened; after signing in
      through the modal the hearts and the count button reappear, and after
      logout they disappear again; searching, genre filtering and pagination
      still work while signed out.
- [x] Write the unit suites first (red): `ShowList/tests/` — `canFavorite` is
      false when the session Entity is signed out and true when signed in, for
      both the stored and the injected favorites paths; `ShowCard` and
      `ShowRowCard` suites — no `FavoriteButton` in the document when
      `canFavorite` is false, and rendering identical to today when it is true
      or omitted; HomePage suites — `favoritesButton` is `null` while signed
      out and `{ count, onClick }` while signed in, `syncFavoritesSummary` is
      not requested on a signed-out mount and is requested when the session
      email changes; an App route suite — `/favorites` redirects to `/` while
      signed out, renders the Favorites page while signed in, and does not
      redirect while the boot restore is still in flight.
- [x] Extend the card contract: `ShowCard` and `ShowRowCard` gain an optional
      `canFavorite` boolean (default `true`) that decides whether
      `FavoriteButton` renders; `ShowList`'s View passes the presenter's value
      through; `ShowListProps` stays unchanged, so no consumer injects a new
      prop (the `isPending` precedent from feature 006).
- [x] Extend `useShowList`: read `selectIsAuthenticated` and expose
      `canFavorite` beside `isFavorite`, `isPending` and `toggleFavorite`, so
      the HomePage and the Favorites page gate from the same Entity in both
      layouts; update the JSDoc to describe the gate.
- [x] Gate the HomePage: `useShowFavorites` reads `selectSessionEmail`, returns
      `favoritesButton: { count, onClick } | null` (null while signed out) and
      runs `syncFavoritesSummary` only for a signed-in email with that email in
      the effect dependencies, so login and logout re-sync; `HomePage.tsx`
      renders the count button only when the prepared payload is not null — no
      derivation in the View.
- [x] Guard the Favorites route: `useApp` keeps exposing the prepared
      `isSessionReady`/`isAuthenticated` flags and `App.tsx` renders
      `<FavoritesPage />` for `/favorites` only when authenticated,
      `<Navigate to="/" replace />` when signed out — no modal is opened by the
      redirect — and nothing for that route until the boot restore settles.
- [x] Verify: all gates green (`npm run css-types` if any CSS changed,
      `typecheck`, `lint`, `test`, `test:e2e`, `build`); `server/` has no diff
      beyond Phase 1; the existing favorites E2E flows pass **unchanged** (the
      backend still accepts unauthenticated writes in this phase); an
      authenticated round through the HomePage and Favorites page in both
      viewports confirms nothing regressed for signed-in users.

**Tests:**

- [x] New E2E guest probes: no hearts in either layout, no count button, the
      sign-in entry point, the `/favorites` redirect, signed-out search intact,
      controls returning on login and disappearing on logout (red -> green).
- [x] New and revised unit suites for `useShowList`, `ShowCard`, `ShowRowCard`,
      `useShowFavorites`/`HomePage` and the App route guard (red -> green).
- [x] All pre-existing suites stay green, including the Phase 2 auth suites and
      every favorites suite (they render signed-in states; the harnesses gain a
      signed-in session where a suite mounts the App tree).
- [x] All 21 existing Playwright flows stay green, the favorites ones
      unchanged.

> **E2E record (2026-11-23).** The favorites scenario modules stay unchanged,
> but the shared `searchSpace` helper in `e2e/favorites-helpers.js` now signs
> in through the modal before searching: the hearts those flows exercise no
> longer render for a signed-out browser. In this phase the backend still
> serves one shared list, so one email unlocks every flow and the
> unauthenticated `beforeEach` clear keeps working; Phase 4 makes the helpers
> email-scoped. New guest flows live in `e2e/auth-guest.spec.js` and write no
> favorites, so they run in parallel with the single-writer spec.

**When ready:**

A signed-out user can search, filter and paginate but sees no favorite control
anywhere, is redirected from `/favorites` to the HomePage and has a visible
sign-in entry point that opens the modal; a signed-in user sees exactly the
Phase 2 behavior, keeps it across a reload of `/favorites`, and a logout leaves
no trace of the previous user's favorites in the UI; every gate is green with
`server/` unchanged beyond Phase 1.

**Acceptance Criteria:**

- [x] While signed out, no heart button is rendered on show cards in the desktop
      `ShowCard` or the mobile `ShowRowCard` layout, and the HomePage
      favorites-count button is not rendered (unit + E2E, both viewports).
- [x] While signed out, navigating to `/favorites` renders no favorites list and
      the app lands on the HomePage, without opening the sign-in modal (unit +
      E2E).
- [x] While signed out, a sign-in entry point is visible and opens the sign-in
      modal (E2E).
- [x] While signed out, search, genre filtering and pagination work exactly as
      before, and the existing search/browse/cache/url-sync Playwright specs
      pass unchanged (E2E).
- [x] While signed in, hearts, the count button, the optimistic toggle, the
      disabled-while-pending heart, soft removal and the deferred refresh behave
      exactly as after features 005/006 (existing suites and flows green).
- [x] A signed-in hard reload of `/favorites` renders the Favorites page and does
      not redirect to the HomePage (unit + E2E).
- [x] After logout, no favorites data of the previous user is displayed anywhere
      in the app — no hearts, no count, no list (unit + E2E).
- [x] `npm run typecheck`, `npm run lint`, `npm run test`,
      `npm run test:e2e` and `npm run build` pass; `server/` has no diff beyond
      Phase 1.

### Phase 4: Backend per-user favorites and enforcement

**Goal:** Favorites are stored and served per email, and every favorites
endpoint requires a signed-in session: an add or remove without one is rejected
and changes nothing, each user sees only their own list, and a logout followed
by a login with the same email restores exactly that list. The frontend needs
no change (the cookie rides along), and the phase closes with a re-check of
every PRD acceptance criterion.

**Affects:** backend

**Tasks:**

- [ ] Revise the backend suites first (red): `server/routes/favorites/tests/storage.test.ts`
      for the email-first signatures — every email owns a separate
      `Record<number, Show>`, an unknown email yields the empty summary and one
      empty page, adding or removing for one email never touches another, the
      list page slices per email, re-adding a known id keeps its position, and
      the exported seam resets every list; `server/tests/app.favorites.test.ts`
      logs in first and replays the session cookie, and gains the enforcement
      and separation cases — all four endpoints answer 401 `{ error }` without a
      session and change no list, user A's adds are absent from user B's
      summary, count and list, a logout plus a login with the same email returns
      the pre-logout list, a login with a different email returns an empty one,
      clearing the `favoritesByEmail` seam (the restart stand-in) empties every
      list, and favorites still never call TVmaze.
- [ ] Add the search-isolation case first (red): `server/tests/app.search.test.ts`
      asserts `GET /api/search` answers 200 with no session cookie, so the PRD's
      "unauthenticated browsing stays fully available" is pinned by a test.
- [ ] Write the E2E separation flow first (red): `e2e/favorites-users.js`,
      registered as one extra test in the single-writer `favorites.spec.js` —
      sign in as user A, add two shows, assert `View favorites (2)` and the
      Favorites page list; log out, sign in as user B, assert
      `View favorites (0)`, the empty state and no favorite heart on the shows A
      favorited; log out, sign in as A again, assert count 2 and the same list.
      Extend `e2e/favorites-helpers.js` with `signIn(page, email)` (opening the
      sign-in modal, filling the email and submitting) and `signOut(page)`, and
      make `summaryIds`/`clearFavorites` email-scoped
      (authenticating through `POST /api/auth/login` and replaying the returned
      cookie where the `request` fixture's context jar does not carry it), give
      each spec its own email so parallel workers never share a list, replace
      the shared `beforeEach` clear with a per-flow sign-in plus scoped clear,
      and keep every touched file <= 120 lines (split the helpers if needed).
- [ ] Rework `server/routes/favorites/storage.ts` to
      `favoritesByEmail: Record<string, Record<number, Show>>` — a plain object,
      no database — with email-first `addFavorite`, `removeFavorite`,
      `getFavoritesSummary` and `getFavoritesListPage`, an unknown email mapping
      to the empty summary and one empty page, the exported reset seam updated
      for the new shape, and both consumers of that seam adjusted; the recorded
      integer-key iteration-order comment stays and is re-worded per email.
- [ ] Rework `server/routes/favorites/favorites.ts`: resolve the session email
      through `@server/auth` in a private `requireEmail(req, res)` guard that
      answers 401 `{ error }` and short-circuits when no session resolves, run it
      at the start of all four handlers, pass the email to the storage helpers,
      and keep the endpoint paths and the `{ count, ids }` / list-page envelopes
      byte-identical so no frontend Task changes.
- [ ] Update the doc comments that still describe one shared list
      (`storage.ts`, `favorites.ts`, `server/routes/favorites/index.ts`) to
      describe the per-email storage, the session requirement and the new reset
      seam.
- [ ] Final verification: all gates green (`typecheck`, `lint`, `test`,
      `test:e2e`, `build`); `web/src/api/`, `toggleShowFavorite`,
      `syncFavoritesSummary` and `fetchFavoritesPage` have no diff (proof the
      cookie needed no client change); an automated E2E round through every PRD
      user scenario in both viewports; re-check every PRD acceptance criterion
      against the finished feature and tick the PRD boxes.

**Tests:**

- [ ] Revised per-email storage suite: isolation between emails, empty defaults,
      pagination per email, seam reset (red -> green).
- [ ] Revised app-level favorites suite: authenticated happy paths, 401
      enforcement on all four endpoints, cross-user invisibility, persistence
      across logout/login, restart-equivalent clearing, no TVmaze call (red ->
      green).
- [ ] New search-isolation assertion: `GET /api/search` needs no session (red ->
      green).
- [ ] New E2E `favorites-users.js`: per-user separation and persistence across
      logout/login, plus the email-scoped helpers every existing favorites flow
      now signs in with (red -> green).
- [ ] All pre-existing suites stay green, including every Phase 1-3 auth,
      Entity, Task, presenter and guest-UI test and all Playwright flows.

**When ready:**

Every favorites request is answered from the signed-in email's own list, an
unauthenticated favorites request is rejected and changes nothing, search stays
open, favorites survive a logout/login round for the same email and disappear
for a different one, clearing the in-memory stores invalidates sessions and
empties every list, the whole automated suite is green, and every PRD
acceptance criterion is re-verified.

**Acceptance Criteria:**

- [ ] While signed in, an add stores the show under that email only: another
      email's summary, count and Favorites page list are unchanged (backend
      suite + E2E).
- [ ] All four favorites endpoints answer 401 `{ error }` without a valid
      session and change no favorites list (backend suite).
- [ ] `GET /api/search` answers 200 with no session cookie (backend suite + the
      unchanged search/browse E2E specs).
- [ ] After a logout and a new login with the same email, the count, the ids and
      the Favorites page list match the pre-logout values; a different email
      starts with an empty list (backend suite + E2E).
- [ ] Clearing the in-memory stores — the automated stand-in for a backend
      restart — invalidates issued session tokens (`me` answers 401) and empties
      every favorites list; the frontend's failed restore then shows the signed-out
      UI (backend suites + the Phase 2 restore suite).
- [ ] Users' favorites and sessions are plain in-memory objects: `server/package.json`
      still lists `express` as its only runtime dependency, `web/package.json`
      gains none, and no file or database persistence exists.
- [ ] The frontend needed no change for per-user favorites: `web/src/api/`,
      `toggleShowFavorite`, `syncFavoritesSummary` and `fetchFavoritesPage` have
      no diff.
- [ ] Every PRD acceptance criterion is re-checked against the finished feature,
      and `npm run typecheck`, `npm run lint`, `npm run test`,
      `npm run test:e2e` and `npm run build` pass.
