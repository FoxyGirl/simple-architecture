# Plan: Restore Home View on Sign-In Page Exit

**PRD:** `features/009-prd-sign-in-home-view-restoration.md`

**Date:** 2026-11-23

## Implementation Phases

### Phase 1: Carry the Home URL and restore it on "Back to Home"

**Goal:** Leaving the HomePage for `/login` remembers the exact Home URL (path
plus the `search`, `genre` and `page` parameters), and the account bar's "Back
to Home" returns to it, falling back to `/` when nothing was carried. This is the
tracer bullet for the feature: after it, the back exit works end to end.

**Affects:** frontend

**Tasks:**

- [x] Add the sign-in navigation-state type beside `FavoritesLocationState` in
      `web/src/pages/types.ts` (same `fromHome: string` shape, documented as the
      URL the `/login` entry was opened from); leave `FavoritesLocationState`
      and its consumer untouched.
- [x] In `web/src/App/AccountBar/logic/useAccountBar.ts`, take `search` from
      `useLocation()` alongside `pathname` and pass
      `{ fromHome: `${pathname}${search}` }` as router state from `goToSignIn`
      only while on the HomePage route (`pathname === '/'`), so no other route
      can be carried.
- [x] In the same presenter, make `goToHome` navigate to the `fromHome` read
      from `location.state` (typed with the new state type) and to `/` when
      that state is absent or malformed.
- [x] Extend the account-bar test harnesses so the mocked `useLocation` route
      object carries `pathname`, `search` and `state`, and the `MemoryRouter`
      entries can carry state.
- [x] Add an E2E flow module for the Back to Home exit under `e2e/` (reusing the
      existing locators in `e2e/auth-helpers.js` and `e2e/favorites-helpers.js`)
      and wire it into the auth spec suite as `e2e/auth-home.spec.js` (keeping
      `e2e/auth.spec.js` under the 120-line limit), using the `space` fixture
      with genre Drama and page 2 (same six-show/two-page layout as `world`,
      without touching the cache-hit counters asserted by the browse and
      URL-sync specs) and writing no favorites so the spec stays
      parallel-safe.
- [x] Run `npm run typecheck`, `npm run lint`, `npm run test` and
      `npm run test:e2e`.

**Tests (written before the implementation, red -> green):**

- [x] `web/src/App/AccountBar/tests/useAccountBar.navigation.test.tsx`
      (`useAccountBar.test.tsx` split to stay under 120 lines): `goToSignIn` on
      `/?search=world&genre=Drama&page=2` calls
      `navigate('/login', { state: { fromHome: '/?search=world&genre=Drama&page=2' } })`;
      on a non-Home route it navigates to `/login` with no `fromHome`.
- [x] `web/src/App/AccountBar/tests/useAccountBar.navigation.test.tsx`:
      `goToHome` navigates to the carried `fromHome`, and to `/` when
      `location.state` is null or holds no usable `fromHome`.
- [x] `web/src/App/AccountBar/tests/AccountBar.navigation.test.tsx`
      (`AccountBar.test.tsx` split and its harness extracted to
      `accountBarHarness.tsx`): clicking Sign in from a parameterized entry and
      then Back to Home lands on that parameterized URL; entering `/login`
      directly and clicking Back to Home lands on `/`.
- [x] E2E: parameterized Home -> Sign in -> Back to Home restores the URL, the
      search input value, the genre chip's `aria-pressed`, the "Page 2 of 2"
      label and the matching results.
- [x] E2E: direct `/login` -> Back to Home -> `/`, signed out, with the default
      Home state and no errors.
- [x] E2E: reload of `/login` after arriving from a parameterized Home URL ->
      Back to Home still returns to that parameterized URL.

**When ready:**

The account bar's Back to Home on `/login` returns the user to the exact HomePage
URL they left from (or to `/` when `/login` was opened directly), the HomePage
renders the restored search text, genre, page and results without further user
input, a reload of `/login` does not lose the carried URL, and the existing
FavoritesPage, HomePage and URL-sync suites still pass unchanged.

**Acceptance Criteria:**

- [x] A signed-out user with an active search, genre and page on the HomePage
      who opens `/login` and clicks "Back to Home" lands on the HomePage URL
      carrying that search, genre and page.
- [x] The restored HomePage shows the same search text in the field, the same
      selected genre, the same active page and the results for those values,
      without the user re-entering anything.
- [x] Opening `/login` directly and clicking "Back to Home" navigates to `/`
      with the default Home state, signed out, and without errors or warnings.
- [x] Reloading `/login` after arriving from a parameterized Home URL keeps the
      carried URL for the Back to Home exit.
- [x] The FavoritesPage "Back to Home" behavior, the HomePage URL
      synchronization and the search, genre and pagination behavior remain
      unchanged (`npm run typecheck`, `npm run lint`, `npm run test` pass).

### Phase 2: Restore the Home URL after a successful sign-in

**Goal:** The "Continue" submit with a valid email returns to the carried Home
URL instead of a bare `/`, so signing in no longer discards the user's search,
genre and page.

**Affects:** frontend

**Tasks:**

- [ ] Add the E2E tests for the sign-in exit first (helper flow wired into
      `e2e/auth.spec.js`), asserting the restored URL, search text, genre, page
      and results, the signed-in account bar and visible favorite controls —
      without toggling any favorite, so the auth spec keeps writing none.
- [ ] In `web/src/pages/SignInPage/logic/useSignInPage.ts`, read the carried
      `fromHome` from `useLocation().state` (typed with the Phase 1 state type)
      and navigate to it on a successful sign-in, falling back to `/` when no
      state was carried.
- [ ] Extend the `useSignInPage` test harness to mock `useLocation` with a
      `state` field next to the existing `useNavigate` mock.
- [ ] Update `e2e/auth-guest.spec.js`, whose flow and comment assume signing in
      lands on a bare Home (it re-fills the search after sign-in), to match the
      restored URL behavior.
- [ ] Confirm the unchanged guards still hold: a signed-in user opening `/login`
      is redirected to `/` (`web/src/App/tests/App.loginRoute.test.tsx`,
      `e2e/auth.spec.js`), and a signed-out `/favorites` visit still lands on `/`.
- [ ] Run the full verification: `npm run typecheck`, `npm run lint`,
      `npm run test` and `npm run test:e2e`.

**Tests (written before the implementation, red -> green):**

- [ ] `web/src/pages/SignInPage/tests/useSignInPage.test.tsx`: a successful
      sign-in with carried state navigates to that URL; with no carried state it
      navigates to `/`.
- [ ] `web/src/pages/SignInPage/tests/useSignInPage.test.tsx`: an invalid email
      submit performs no request and no navigation and leaves the carried state
      intact for a later exit; a rejected login keeps the page with the backend
      message.
- [ ] E2E: parameterized Home -> Sign in -> valid email -> the restored URL,
      search text, genre, page and results, signed in (email in the account bar,
      favorite controls visible).
- [ ] E2E: direct `/login` -> valid email -> `/` with the default Home state,
      signed in.
- [ ] E2E: reload of `/login` after arriving from a parameterized Home URL ->
      valid email -> the parameterized Home URL.
- [ ] E2E: an invalid-email submit keeps the user on `/login` with the inline
      error, and a following Back to Home still restores the parameterized URL.

**When ready:**

Both `/login` exits — the account bar's Back to Home and a successful sign-in —
return the user to the HomePage URL they came from (or to `/` when `/login` was
opened directly), the restored view shows the same search, genre, page and
results, a reload of `/login` keeps the carried URL for both exits, the
signed-in `/login` redirect and the signed-out `/favorites` redirect are
unchanged, and every suite passes.

**Acceptance Criteria:**

- [ ] A user who signs in successfully from `/login` entered from a
      parameterized Home URL lands on that same HomePage URL, with the search,
      genre, page and results restored.
- [ ] Opening `/login` directly and signing in successfully navigates to `/`
      with the default Home state, signed in.
- [ ] Reloading `/login` after arriving from a parameterized Home URL keeps the
      carried URL for a successful sign-in as well.
- [ ] Submitting an invalid email on `/login` keeps the user on `/login` with
      the inline error and does not discard the carried Home URL.
- [ ] When no Home URL was carried, every SignInPage exit falls back to `/`
      without errors or warnings.
- [ ] A signed-in user who opens `/login` is still redirected to `/`.
- [ ] The new behavior is covered by presenter-level Vitest tests and Playwright
      E2E tests, and `npm run typecheck`, `npm run lint`, `npm run test` and
      `npm run test:e2e` pass.
