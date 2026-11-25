# Plan: Sign In Page and UI-Kit Buttons

**PRD:** features/008-prd-sign-in-page-and-ui-kit-buttons.md

**Date:** 2026-11-23

**Revision:** 2026-11-23 — Phase 1 executed without design changes (pen.dev
plan usage limit reached; user decision): the canvas task and its criterion are
deferred, everything else shipped. The `/login` guard tests were split into
`web/src/App/tests/App.loginRoute.test.tsx` (with a shared
`routesHarness.tsx` helper) to respect the 120-line lint limit.
2026-11-23 — the sign-in copy is written as plain text in the View and
presenter; the `SIGN_IN_PAGE_MESSAGES` constants file was removed at user
request. The account bar's `ACCOUNT_BAR_LABELS` copy was inlined the same way.
2026-11-23 — Phase 2 executed without the design-canvas task (pen.dev still
blocked): the Button component frame remains deferred. To keep the two
existing button treatments without a design change, the Button gained an
optional `variant: 'primary' | 'secondary'` prop (secondary = account-bar
pill, primary = form submit), recorded here as a deliberate extension of the
planned API. A new `AccountBar.test.tsx` View suite exercises the icon
buttons.
2026-11-23 — post-phase UI request: on `/login` the account bar swaps "Sign in"
for "Back to Home" (the header is now the page's Cancel/Back action and the
in-page link was removed); the Sign In panel gained more spacing between its
elements and above/before the form. Unit and E2E suites updated.

> **Approach.** Two frontend-only phases (the PRD excludes backend changes),
> ordered so each phase leaves the app fully working. Phase 1 is the tracer
> bullet: the sign-in modal becomes a dedicated `SignInPage` on a new `/login`
> route — navigation from the account bar, the route guard, the Cancel/Back
> action, the post-sign-in navigation and the modal removal all land together,
> with the modal-era suites and E2E specs replaced test-first. Phase 2 adds the
> shared `Button` primitive to the (currently empty) `web/src/ui-kit/` and
> re-points the three named buttons at it, giving "Sign In" and "Logout" their
> icons. Each phase updates the design canvas before the code that mirrors it,
> per the design system workflow in AGENTS.md.
>
> **Key decisions (recorded):**
>
> - **Page placement.** `web/src/pages/SignInPage/`, mirroring `HomePage/` and
>   `FavoritesPage/` (`SignInPage.tsx` View, `logic/useSignInPage.ts`
>   presenter, `logic/tasks/signIn.ts`, `utils/isEmail.ts`, `constants.ts`,
>   `types.ts`, `index.ts` barrel, CSS Module + generated `.d.ts`). The
>   sign-in Task and the `isEmail` helper move there from
>   `web/src/App/AuthModal/` unchanged in behavior — the single-consumer Task
>   placement rule follows the consumer.
> - **Navigation lives in presenters** (`docs/architecture.md` Router rule):
>   `useSignInPage` uses `useNavigate` to go to `/` after a successful sign-in
>   and on Cancel/Back; `useAccountBar` gains `useNavigate` and exposes a
>   prepared `goToSignIn` handler, so `AccountBarProps.onSignIn` and App's
>   modal plumbing (`isAuthModalOpen`, `openAuthModal`, `closeAuthModal` in
>   `useApp`) are removed. Cancel/Back navigates to `/` (not
>   `history.back()`) — objectively verifiable and matches the PRD.
> - **Route guard mirrors the existing `/favorites` pattern** in `App.tsx`:
>   the `/login` element renders `<SignInPage />` while signed out,
>   `<Navigate to="/" replace />` once `isAuthenticated`, and `null` until the
>   boot restore settles (`isSessionReady`), so a signed-in reload of `/login`
>   never flashes the form.
> - **Copy.** Existing `AUTH_MODAL_MESSAGES` wording is carried over into
>   `SIGN_IN_PAGE_MESSAGES` (title "Sign in", label "Email", submit
>   "Continue"/"Signing in…", error "Enter a valid email address."); the
>   description states that signing in is required to save favorites (the
>   current "Enter your email to save favorites to your own list." already does
>   and may be kept or expanded). Keeping the accessible names ("Sign in",
>   "Logout", "Continue") stable minimizes E2E locator churn.
> - **Dismissal semantics change.** Backdrop click and Escape dismissal die
>   with the modal (`useAuthModalDismiss.test.tsx` is deleted, not ported);
>   the page's only leave-without-signing-in affordance is the Cancel/Back
>   action. The dialog ARIA pattern (`role="dialog"`, `aria-modal`,
>   `data-testid="auth-modal-backdrop"`) disappears; the error keeps
>   `role="alert"` and the input keeps `aria-invalid`/`aria-describedby`.
> - **ui-kit Button.** `web/src/ui-kit/Button/` — strictly presentational
>   (`docs/component-organization.md`): props for the label, an optional
>   `icon?: ReactNode` (consumers pass the lucide element; Button never
>   imports lucide or app features), `type?: 'button' | 'submit'`, `disabled`
>   and `onClick`. No presenter. Icons render with `aria-hidden` so accessible
>   names stay the text labels. Recorded icon choices: lucide `LogIn` for
>   "Sign In", `LogOut` for "Logout".
> - **E2E.** `e2e/auth-helpers.js` is rewritten from modal locators
>   (`getByRole('dialog')`, backdrop, close button) to page locators
>   (`/login` URL, page-scoped email input, "Continue" submit, Cancel/Back);
>   `signIn`/`openSignIn` keep their signatures so the consumers
>   (`auth.spec.js`, `auth-guest.spec.js`, `favorites-helpers.js`,
>   `favorites-users.js`) change minimally. The single-writer rule is
>   untouched: auth flows write no favorites and stay parallel-safe.
> - **Feature 007 bookkeeping.** Its PRD/plan get a revision note recording
>   that the modal decision is reversed by feature 008 and the "no login
>   route exists" criterion is superseded.
> - **Tokens.** New UI reuses existing tokens (`--radius-btn` already exists);
>   `--scrim`/`--radius-modal` lose their only consumer but are left in place
>   (removal is not in the PRD). Any token that must be added is written to
>   the canvas and `web/src/styles/tokens.css` with identical names/values.
> - **Testing.** Red -> green per AGENTS.md: every phase writes/updates its
>   automated tests before the implementation, and `npm run css-types` runs
>   whenever a CSS Module is added or changed.

## Implementation Phases

### Phase 1: Sign In page replaces the modal

**Goal:** The `/login` route hosts a dedicated Sign In page with the
explanatory favorites text and a Cancel/Back action; the account bar navigates
to it; the modal and all of its state, tests and locators are gone; guards and
post-sign-in navigation work end to end.

**Affects:** frontend (+ design canvas, feature docs)

**Tasks:**

- [x] Rewrite `e2e/auth-helpers.js` to page-based locators and update
      `e2e/auth.spec.js` (sign-in through `/login`, invalid submits stay on the
      page with the inline error, Cancel/Back returns to `/` signed out,
      signed-in visit to `/login` redirects to `/`, no `role="dialog"`
      anywhere) and the modal assertions in `e2e/auth-guest.spec.js`; verify
      `e2e/favorites-helpers.js` and `e2e/favorites-users.js` still work
      through the unchanged `signIn` helper signature — all red against the
      current app.
- [x] Replace the modal-era unit suites: delete
      `web/src/App/AuthModal/tests/` coverage of dialog behavior; add
      `web/src/pages/SignInPage/tests/` (View render: heading, single email
      input, submit, explanatory text mentioning favorites, Cancel/Back;
      presenter: local validation, in-flight disabled flag, success ->
      `navigate('/')`, backend error -> inline message, cancel ->
      `navigate('/')`; relocated `logic/tasks/tests/signIn.test.ts`); extend
      `web/src/App/tests/App.routes.test.tsx` (signed-in `/login` -> `/`,
      no decision before the restore settles, signed-out `/favorites` -> `/`
      without dialog assertions); update `web/src/App/tests/useApp.test.tsx`
      (modal state removed) and
      `web/src/App/AccountBar/tests/useAccountBar.test.tsx` (`goToSignIn`
      navigates to `/login`) — all red.
- [ ] **DEFERRED** — Add the Sign In screen to `design/ScreenScout-design.pen`
      via the pen.dev MCP tools (read `pen-schema.md`/`code-website.md` skills
      first): heading, explanatory favorites text, email input, submit,
      Cancel/Back; reuse existing tokens; save the canvas. _(Blocked
      2026-11-23: pen.dev plan usage limit reached; per user decision the page
      ships without design changes and the canvas update is deferred.)_
- [x] Create `web/src/pages/SignInPage/` per the recorded layout: move
      `signIn.ts` (Task), `isEmail.ts` (util) and the copy constants out of
      `App/AuthModal/`; build the View (no dialog/backdrop markup, error keeps
      `role="alert"`), the `useSignInPage` presenter (draft, submitting,
      error, focus on mount, `useNavigate`) and the CSS Module; run
      `npm run css-types`.
- [x] Wire the `/login` route + guard in `web/src/App/App.tsx` (mirroring the
      `/favorites` pattern) and remove the `AuthModal` import and rendering;
      strip `isAuthModalOpen`/`openAuthModal`/`closeAuthModal` from
      `web/src/App/logic/useApp.ts`.
- [x] Update `web/src/App/AccountBar/`: presenter exposes `goToSignIn` via
      `useNavigate('/login')`; remove `AccountBarProps.onSignIn` and App's
      handler wiring; update `types.ts` comments.
- [x] Delete `web/src/App/AuthModal/` entirely, grep `web/src` and `e2e/` for
      leftover `AuthModal`/`auth-modal` references, and append the revision
      note to `features/007-prd-email-authentication-and-user-specific-favorites.md`
      (and its plan) recording the reversal.

**Tests:**

- [x] `web/src/pages/SignInPage/tests/SignInPage.test.tsx` — renders heading,
      exactly one email input, submit, explanatory favorites text and
      Cancel/Back; no `role="dialog"` or backdrop.
- [x] `web/src/pages/SignInPage/tests/useSignInPage.test.tsx` — invalid/empty
      submit sets the error and sends no request; valid submit sets the
      in-flight flag, and success navigates to `/`; a backend error keeps the
      page with the backend message; cancel navigates to `/` signed out
      (`useSignInPageCancel.test.tsx`).
- [x] `web/src/pages/SignInPage/logic/tasks/tests/signIn.test.ts` — relocated
      suite passes unchanged (stubbed `requestJson`, `clearFavorites` +
      `replaceSession` dispatches, discriminated outcome).
- [x] `web/src/App/tests/App.routes.test.tsx` — `/login` guard: signed-in ->
      `/`, signed-out renders the page, pending restore renders neither page
      nor redirect (`App.loginRoute.test.tsx`); `/favorites` guard unchanged.
- [x] `web/src/App/AccountBar/tests/useAccountBar.test.tsx` and
      `web/src/App/tests/useApp.test.tsx` — updated interfaces, no modal
      state.
- [x] `e2e/auth.spec.js` + `e2e/auth-guest.spec.js` — page-based flows green,
      including reload persistence and the signed-out browsing UI (regression
      for feature 007 behavior).

**When ready:**

`npm run typecheck`, `npm run lint`, `npm run test` and `npm run test:e2e`
pass; `web/src/App/AuthModal/` no longer exists; no source or spec file
mentions `auth-modal`; `/login` is reachable only through the account bar's
"Sign In" button or direct navigation.

**Acceptance Criteria:**

- [x] Navigating to `/login` renders the Sign In page with heading, one email
      input, submit, explanatory text stating signing in is required to save
      favorites, and a Cancel/Back action; no modal, backdrop or
      `role="dialog"` is rendered anywhere.
- [x] Clicking "Sign In" in the account bar while signed out navigates to
      `/login`.
- [x] Submitting a valid email starts the backend session, navigates to `/`,
      and the email, Logout and favorite controls are visible; submitting an
      empty/non-email value shows the inline error with no session and no
      navigation, and the submit is disabled while the request is in flight.
- [x] Cancel/Back navigates to `/` and leaves the app signed out.
- [x] A signed-in user opening `/login` is redirected to `/`; a signed-out user
      opening `/favorites` is still redirected to `/`, and nothing opens the
      Sign In page automatically.
- [x] Logout, reload session persistence, per-user favorites separation and
      unauthenticated browsing behave exactly as in feature 007 (existing
      suites and specs pass).
- [ ] The canvas shows the Sign In screen and every token it uses exists with
      identical names/values in `web/src/styles/tokens.css`. _(Deferred with
      the pen.dev canvas update — user decision 2026-11-23: ship without design
      changes.)_

### Phase 2: UI-kit Button and icon buttons

**Goal:** A shared presentational `Button` lives in `web/src/ui-kit/` and
renders exactly the three named buttons — the account bar's "Sign In" and
"Logout" (now with icons) and the Sign In page's submit — with no other button
migrated.

**Affects:** frontend (+ design canvas)

**Tasks:**

- [ ] **DEFERRED** — Add the Button component frame to
      `design/ScreenScout-design.pen` via the pen.dev MCP tools (default /
      with-icon / disabled states as used by the three consumers), place it in
      the components area per the canvas layout rule (components on top,
      screens below), reflect it on the Sign In screen and the account bar, add
      any new token to both the canvas and `web/src/styles/tokens.css` with
      identical names/values, and save. _(Blocked 2026-11-23: pen.dev plan
      usage limit still reached; per user decision the phase ships without
      design changes and the canvas update is deferred.)_
- [x] Write the failing unit suite `web/src/ui-kit/Button/tests/Button.test.tsx`
      (renders the label as the accessible name; optional icon renders with
      `aria-hidden` and does not change the accessible name; `type` defaults
      and `type="submit"`; `disabled` propagates; `onClick` fires) plus the
      updated AccountBar expectations (each action contains an `aria-hidden`
      icon and keeps its text label).
- [x] Create `web/src/ui-kit/Button/`: `Button.tsx`, `Button.module.css`
      (port the shared visual treatment from AccountBar `.action` / the sign-in
      submit styles, token-based), `types.ts`, `index.ts` barrel exporting the
      View only; strictly presentational, no presenter, no lucide or app
      imports; run `npm run css-types`.
- [x] Migrate the AccountBar "Sign In" and "Logout" buttons to `Button` with
      lucide `LogIn`/`LogOut` icons passed as the `icon` prop (icons
      `aria-hidden`, accessible names remain "Sign in"/"Logout"); remove the
      superseded `.action` styles.
- [x] Migrate the SignInPage submit to `Button` (`type="submit"`, disabled
      while submitting, "Continue"/"Signing in…" labels unchanged); remove the
      superseded submit styles.
- [x] Verify no other button was migrated (grep for `ui-kit` imports outside
      the three consumers; pagination, search submit, genre chips, favorite
      heart, favorites-count, StatusPanel and FavoritesPage back buttons
      untouched) and adjust `e2e/auth-helpers.js` locators only if the
      rendered accessible names changed.
- [x] Close with the full PRD sweep: re-check every acceptance criterion of
      `features/008-prd-sign-in-page-and-ui-kit-buttons.md` against the app and
      the suites.

**Tests:**

- [x] `web/src/ui-kit/Button/tests/Button.test.tsx` — label, icon
      `aria-hidden`, type, disabled, click-through.
- [x] `web/src/App/AccountBar/tests/` — "Sign In" and "Logout" render through
      the ui-kit Button, each with an `aria-hidden` icon and its unchanged
      accessible name; `goToSignIn`/logout behavior unchanged.
- [x] `web/src/pages/SignInPage/tests/` — submit renders through the ui-kit
      Button and keeps the disabled-while-submitting behavior.
- [x] Existing suites prove non-migration: pagination, search, genre filter,
      favorite and favorites-count component tests pass without ui-kit
      references.
- [x] `e2e/auth.spec.js` — icon buttons still pass the role/name locators;
      logout flow green.

**When ready:**

`npm run typecheck`, `npm run lint`, `npm run test`, `npm run test:e2e` and
`npm run format:check` pass; `web/src/ui-kit/Button/` is the only ui-kit
component and has exactly three consumers; the canvas and `tokens.css` agree
on every token used by the new UI; every PRD acceptance criterion is checked
off against the running app and the suites.

**Acceptance Criteria:**

- [x] A shared presentational Button exists in `web/src/ui-kit/` in its own
      directory with an `index.ts` barrel and a CSS Module, takes content,
      state and handlers through props, and contains no business rules or
      page/feature knowledge.
- [x] The account bar's "Sign In" and "Logout" buttons each render an
      `aria-hidden` icon plus their unchanged text label through the ui-kit
      Button, and the Sign In page's submit renders through it as well.
- [x] No other button in the app is rendered through the ui-kit Button.
- [x] Logout still ends the backend session and returns the app to the
      unauthenticated state; all Phase 1 criteria still hold.
- [ ] `design/ScreenScout-design.pen` shows the Button component and the
      updated screens, with canvas and `tokens.css` token names/values
      identical. _(Deferred with the pen.dev canvas update — user decision
      2026-11-23: ship without design changes.)_
- [x] All modal-era tests are replaced and `npm run typecheck`,
      `npm run lint`, `npm run test` and `npm run test:e2e` pass, covering the
      `/login` route, post-sign-in navigation, both redirects, Cancel/Back,
      the explanatory text and the icon buttons.
