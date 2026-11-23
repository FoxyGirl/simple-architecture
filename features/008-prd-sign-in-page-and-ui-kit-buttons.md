# PRD: Sign In Page and UI-Kit Buttons

**Date**: 2026-11-23
**Status**: Implemented
**Revision**: 2026-11-23 — implemented in two phases (the Sign In page replacing
the modal, then the ui-kit Button and the icon buttons). Every functional
criterion was verified against the unit and E2E suites. The design-canvas work
remains deferred by the 2026-11-23 user decision (pen.dev plan usage limit), so
the canvas criterion below stays open and no `.pen` change was made.

## Purpose

Signing in currently happens in a modal, which gives the authentication step no
URL of its own and little room to explain why an account is needed. This feature
replaces the sign-in modal with a dedicated Sign In page that tells users signing
in is required to save favorites, and introduces a shared Button primitive in
the ui-kit used for the sign-in form submit and for the icon-accompanied
"Sign In" and "Logout" buttons.

## User Scenarios

- Unauthenticated user clicks "Sign In" in the account bar -> the app navigates
  to the Sign In page at `/login`.
- User on the Sign In page reads the explanatory text -> it states that signing
  in is required to save favorites.
- User submits a valid email on the Sign In page -> the backend session starts,
  the app navigates to the HomePage (`/`), and the email, the Logout action and
  the favorite controls become visible.
- User submits an empty or non-email value on the Sign In page -> an error
  message is shown on the page, no session starts and no navigation occurs.
- User clicks the Cancel/Back action on the Sign In page -> the app returns to
  the HomePage and stays signed out.
- Signed-in user opens `/login` directly -> the app redirects to the HomePage.
- Unauthenticated user opens `/favorites` directly -> the app redirects to the
  HomePage, exactly as today.
- Signed-in user clicks "Logout" (a button with an icon) -> the session ends and
  the app returns to the unauthenticated state, exactly as today.
- Unauthenticated user searches, filters by genre and paginates -> results
  behave exactly as today, with no favorite controls rendered.

## In scope

- A dedicated Sign In page on a new `/login` route, containing a heading, a
  single email input, a submit action and validation/error behavior equivalent
  to the current modal (empty or non-email values are rejected with an on-page
  error message; the submit action is disabled while the sign-in request is in
  flight).
- Explanatory text on the Sign In page stating that signing in is required to
  save favorites.
- A Cancel/Back action on the Sign In page that returns to the HomePage without
  signing in.
- Removal of the sign-in modal: no modal, backdrop or dialog is rendered
  anywhere in the app after this feature.
- The account bar's "Sign In" entry point becomes a navigation to `/login`
  instead of opening a modal.
- A route guard: an authenticated user who opens `/login` is redirected to the
  HomePage.
- Unchanged signed-out `/favorites` behavior: it keeps redirecting to the
  HomePage.
- A shared, presentational Button component in `web/src/ui-kit/` supporting an
  optional icon, a disabled state and the label/submitting-label needs of its
  three consumers.
- Icons on the account bar's "Sign In" and "Logout" buttons, both rendered as
  ui-kit Buttons with an icon and their existing text label.
- The Sign In page's form submit button rendered as a ui-kit Button.
- Automated tests for the new behavior (frontend Vitest + Testing Library,
  Playwright E2E), including replacing the modal-era suites and specs.
- Updating the design canvas (`design/ScreenScout-design.pen`) with the new
  Sign In screen and the Button component, per the design system workflow.

## Out of scope

- Passwords, registration forms, password recovery, email verification, or any
  second factor — authentication stays email-only.
- Any backend change: authentication, sessions, per-user favorites and all
  `/api` endpoints keep their current behavior.
- Returning the user to the page they came from after sign-in — the destination
  is always the HomePage.
- Redirecting a signed-out `/favorites` visit to the Sign In page — the
  redirect target stays the HomePage.
- Opening `/login` automatically (on app load or when a favorite action is
  rejected); the Sign In page is only reached by explicit navigation.
- Migrating any other buttons to the ui-kit Button in this iteration:
  pagination and arrow buttons, the search field's submit button, genre filter
  chips, the favorite heart button, the favorites-count button, the StatusPanel
  action and the FavoritesPage back button all stay as they are.
- Guest favorites, session expiry, account management and security hardening —
  all remain excluded as in feature 007.
- Changes to search, genre filtering, pagination, TVmaze interaction and
  caching, toasts, optimistic toggle, soft removal or URL state sync beyond
  what the modal removal and the new route require.

## Technical limitations

- This feature reverses an explicit decision of feature 007, which removed the
  dedicated login page in favor of a modal ("no login route exists" is one of
  its acceptance criteria). Feature 007's document needs a revision note, and
  its modal-specific criteria are superseded by this PRD.
- The app has exactly two routes today (`/` and `/favorites`, in
  `web/src/App/App.tsx`); adding `/login` enlarges the URL surface, and
  `App.routes.test.tsx` plus the E2E specs encode the current routing.
- The sign-in behavior to preserve already exists inside the modal folder:
  `useAuthModal` (presenter), `logic/tasks/signIn.ts`, `isEmail` validation and
  `AUTH_MODAL_MESSAGES` copy, covered by `web/src/App/AuthModal/tests/`
  (including `useAuthModalDismiss.test.tsx` for backdrop/Escape dismissal that
  disappears with the modal). These suites must be replaced, not just extended;
  AGENTS.md mandates a test-first workflow.
- There is no shared button component to literally "move": buttons today are
  plain `<button>` elements with per-component CSS (e.g. AccountBar `.action`,
  AuthModal `.submit`). "Move into the UI kit" therefore means creating the
  Button primitive in `web/src/ui-kit/` (currently empty apart from
  `.gitkeep`) and re-pointing the three named buttons at it.
- `docs/component-organization.md` requires ui-kit components to be strictly
  presentational (no business rules, no page/feature knowledge; content, state
  and handlers come through props), to live in their own directory with an
  `index.ts` barrel and a CSS Module, and to have a presenter only if needed.
- The design system workflow applies: `design/ScreenScout-design.pen` and
  `web/src/styles/tokens.css` are the sources of truth; any new token must be
  added to both with identical names and values (`--radius-btn` already exists;
  `--scrim` and `--radius-modal` exist for the modal being removed).
- Icons come from `lucide-react`, already a dependency and already used in the
  account bar (`Tv`) and the modal (`X`); no new dependency is expected. Icon
  glyphs must stay decorative (`aria-hidden`) so the buttons' accessible names
  remain their text labels.
- The account bar renders outside the `<Routes>` tree, so it (and its "Sign
  In"/"Logout" buttons) is visible on `/login` as well; this PRD does not
  require hiding it there.
- Every CSS Module needs a regenerated `<Component>.module.css.d.ts`
  (`npm run css-types`) for the strict TypeScript setup to compile.

## Acceptance Criteria

- [x] Navigating to `/login` renders a dedicated Sign In page with a heading,
      exactly one input (email), a submit action, explanatory text stating that
      signing in is required to save favorites, and a Cancel/Back action; no
      modal, backdrop or `role="dialog"` element is rendered anywhere in the
      app.
- [x] Clicking "Sign In" in the account bar while signed out navigates to
      `/login`.
- [x] Submitting a valid email on `/login` starts a backend session, navigates
      to `/`, and the app then displays the email, the Logout action and the
      favorite controls.
- [x] Submitting an empty value or a value that is not an email on `/login`
      starts no session, shows an error message on the page and performs no
      navigation; while the sign-in request is in flight the submit action is
      disabled.
- [x] Clicking the Cancel/Back action on `/login` navigates to `/` and leaves
      the app signed out.
- [x] A signed-in user who opens `/login` is redirected to `/`.
- [x] A signed-out user who opens `/favorites` is redirected to `/`, and the
      Sign In page is never opened automatically by the app.
- [x] The account bar's "Sign In" button renders an icon plus its text label,
      and the "Logout" button renders an icon plus its text label; the icons are
      `aria-hidden` and the buttons' accessible names remain the text labels.
- [x] A shared presentational Button component exists in `web/src/ui-kit/` in
      its own directory with an `index.ts` barrel and a CSS Module, receives
      content, state and handlers through props, and contains no business rules
      or page/feature knowledge.
- [x] The Sign In page's submit button and the account bar's "Sign In" and
      "Logout" buttons are rendered through the ui-kit Button; no other button
      in the app is migrated to it.
- [x] Clicking "Logout" ends the session on the backend and returns the app to
      the unauthenticated state exactly as before this feature.
- [x] Session persistence across a browser reload, per-user favorites
      separation and unauthenticated browsing (search, genre filtering,
      pagination with no favorite controls) behave exactly as in feature 007.
- [ ] `design/ScreenScout-design.pen` shows the Sign In screen and the Button
      component, and every token used by the new UI exists with identical names
      and values in both the canvas and `web/src/styles/tokens.css`.
      _(Deferred: pen.dev plan usage limit reached; user decision 2026-11-23 to
      ship without design changes.)_
- [x] The modal-era tests are replaced and `npm run typecheck`, `npm run lint`,
      `npm run test` and `npm run test:e2e` pass, with new automated tests
      covering the `/login` route, the post-sign-in navigation, both redirects
      (signed-in on `/login`, signed-out on `/favorites`), the Cancel/Back
      action, the explanatory text and the icon buttons.
