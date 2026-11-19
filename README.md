# Simple Architecture

A simple React app built with:

- [React 19](https://react.dev/)
- [TypeScript 6](https://www.typescriptlang.org/) (`strict`)
- [Vite 7](https://vite.dev/)
- [React Router 7](https://reactrouter.com/)
- [Vitest](https://vitest.dev/) + [supertest](https://github.com/ladjs/supertest)
  (unit/integration) and [Playwright](https://playwright.dev/) (E2E)
- [ESLint 9](https://eslint.org/) (flat config)
- [Prettier](https://prettier.io/)

## Scripts

| Command                | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `npm run dev`          | Start the frontend dev server (port 5173)        |
| `npm run server`       | Start the backend Express process (port 3001)    |
| `npm run build`        | Typecheck, then build into `web/dist/`           |
| `npm run preview`      | Serve the production build                       |
| `npm run typecheck`    | Typecheck both workspaces (no emit)              |
| `npm run css-types`    | Regenerate CSS Module type files                 |
| `npm run test`         | Vitest suites of both workspaces                 |
| `npm run test:e2e`     | Playwright E2E (boots stub + backend + frontend) |
| `npm run lint`         | Check with ESLint                                |
| `npm run lint:fix`     | Auto-fix ESLint issues                           |
| `npm run format`       | Format files with Prettier                       |
| `npm run format:check` | Check formatting with Prettier                   |
| `npm run prepare`      | Install husky git hooks (on install)             |

## Running the app

The app runs as two processes — start both in separate terminals:

| Terminal 1         | Terminal 2                       |
| ------------------ | -------------------------------- |
| `npm run server`   | `npm run dev`                    |
| Express on `:3001` | Vite on `:5173`, open in browser |

The frontend only calls its own origin under `/api/...`; the Vite dev
server proxies `/api` to the backend (see `server.proxy` in
`web/vite.config.ts`), and the backend owns the TVmaze interaction plus the
favorites API (`/api/search`, `POST/DELETE /api/favorites`,
`GET /api/favorites/count` and the paginated `GET /api/favorites` list served
from the in-memory storage). With `npm run server` stopped, searches show the
app's error panel and recover via "Retry request" once it is up again.

## TypeScript

`web/tsconfig.json` is a solution file that references two projects:

- `web/tsconfig.app.json` — the application code in `web/src/` (incl. tests)
- `web/tsconfig.node.json` — the Vite and Vitest configs

`server/tsconfig.json` is a single project covering the backend workspace
under the same strict rules.

The compiler runs in `strict` mode with `noUncheckedIndexedAccess`,
`verbatimModuleSyntax` and `erasableSyntaxOnly`. Types live in a `types.ts`
file next to the code that owns them.

Import specifiers carry no file extension. `@api`/`@hooks` alias frontend
folders, and `~` aliases the `server/` root so backend routes never write
`../../` climbs:

```ts
import { searchShowsPage } from '@api/shows';
import { useMediaQuery } from '@hooks/useMediaQuery';
import { getCachedShows } from '~/cache';
```

### CSS Module types

`vite/client` types `*.module.css` as an index signature, which widens a class
lookup to `string | undefined` and breaks the `clsx` object form. Each CSS
Module therefore gets a generated `<Component>.module.css.d.ts` that gives
every class a literal type:

```jsx
className={clsx(styles.chip, { [styles.chipActive]: isActive })}
```

Run `npm run css-types` after editing a CSS file — `npm run typecheck` and
`npm run build` regenerate the declarations first, and the dev server
regenerates them on every CSS change. As a bonus, a typo in a class name
becomes a compile error.

## Git hooks

[husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/lint-staged/lint-staged) run
on every commit, against **staged files only**:

| Staged file type                             | Tasks                              |
| -------------------------------------------- | ---------------------------------- |
| `*.js`, `*.jsx`, `*.ts`, `*.tsx`             | `eslint --fix`, `prettier --write` |
| `*.json`, `*.css`, `*.md`, `*.html`, `*.yml` | `prettier --write`                 |

Fixable problems are repaired automatically and the commit continues;
unfixable errors (e.g. `no-undef`) **abort the commit**. Husky installs itself
via the `prepare` script, so `npm install` wires up the hooks automatically.

## Structure

The repository is an npm-workspaces monorepo with a shared tooling root:

```
web/                  # frontend workspace (Vite + React)
  src/
    main.tsx          # Entry point, mounts <App /> in the Redux Provider + Router
    App/              # the App shell component (layout, nav, routes, Toaster)
      App.tsx         # Layout + routes + the single global <Toaster />
      App.module.css  # App shell styles (CSS Module)
      index.ts        # public export
      Toaster/        # the global toast outlet component (token-skinned)
        Toaster.tsx   # Sonner config: placement, duration, tokens
        Toaster.module.css
        index.ts      # public export
    index.css         # Global reset + token import
    vite-env.d.ts     # Vite client types (CSS Modules, import.meta.env)
    api/
      shows.ts        # paginated show search via the backend (/api/search)
      favorites.ts    # favorites calls: add, remove, count, list page
      request.ts      # shared fetch layer (URLs, JSON method/body, ApiError)
      types.ts        # TVmaze shapes + search and favorites envelopes
    hooks/
      useMediaQuery.ts
    notification/     # library-independent notify API (wraps Sonner)
      index.ts        # barrel: notify + option types
      notify.ts       # success/error/info/warning/loading/promise wrapper
      types.ts        # NotifyOptions / NotifyPromiseMessages
      tests/          # notify delegation suite (Sonner mocked)
    pages/
      HomePage/
        HomePage.tsx        # "/" route
        HomePage.module.css # Page styles (CSS Module)
        index.ts            # public export
        FavoritesCountButton/ # hero count pill: Entity count + navigation
          FavoritesCountButton.tsx # presentational View (count + onClick)
          FavoritesCountButton.module.css
          index.ts          # public export
        logic/
          useHomePage.ts    # page presenter (Entity reads + Task orchestration)
          tasks/
            fetchShowsPage.ts # shows-fetch Task: API -> store.dispatch
        tests/              # page-level suites (jsdom + Testing Library)
      components/           # components shared by both pages (common ancestor)
        FavoriteButton/     # heart toggle used by the cards on both pages
        Pagination/         # page controls: search results + favorites list
      tasks/                # Tasks shared by both pages (common ancestor)
        toggleShowFavorite.ts # favorite-toggle Task (hearts on both pages)
        syncFavoritesSummary.ts # summary Task: GET count -> Entity dispatch
        fetchFavoritesPage.ts # list Task: GET page -> Entity dispatch
        types.ts            # Task result types
        tests/              # Task unit suites (API mocked at the boundary)
    store/
      store.ts        # Redux store (configureStore, shows reducer)
      types.ts        # RootState / AppDispatch
      shows/          # shows Entity: slice, selectors, state types
      index.ts        # barrel: store, root types, Entity actions/selectors
    styles/
      tokens.css      # Design tokens as CSS custom properties
    ui-kit/           # Shared, project-wide UI components
  index.html          # SPA shell
  vite.config.ts      # Vite config (plugins, aliases, /api dev proxy)
  vitest.config.ts    # Vitest config (jsdom, testing-library)
  scripts/
    generate-css-types.mjs  # CSS Module type declaration generator
  vercel.json         # SPA rewrites (set Vercel "Root Directory" to `web/`)

server/               # backend workspace (Express, TypeScript ESM via tsx)
  app.ts              # exported Express app: JSON body parsing + the mounted routes
  index.ts            # entry: starts the app on port 3001
  types.ts            # TVmaze API shapes owned by the backend
  routes/             # one folder per HTTP route, mounted under /api by app.ts
    index.ts          # barrel: re-exports every route's router
    search/           # the GET /api/search route (q, genre, page)
      index.ts        # barrel: exports searchRouter only
      search.ts       # route handler: validation, cache call, errors
      shows.ts        # server-side genre filtering + search page builder
      tests/          # unit suite for the route's private helpers
    favorites/        # the favorites API over the in-memory storage
      index.ts        # barrel: favoritesRouter (+ favorite for the suite reset)
      favorites.ts    # route handlers: add, remove, count, paginated list
      storage.ts      # plain-object favorites keyed by show id + helpers
      types.ts        # FavoritesSummary / FavoritesListPage shapes
      tests/          # unit suite for the storage and its helpers
  pagination/         # shared pagination primitives (3 shows per page)
    index.ts          # barrel: RESULTS_PER_PAGE, getPageCount, clampPage,
                      # getPageShows
    pagination.ts
    tests/            # unit suite for the shared helpers
  cache/              # 5-minute plain-object TVmaze response cache
    index.ts          # barrel: getCachedShows (+ cache for the suites)
    cache.ts
    tests/            # unit suite for the cache
  tvmaze/             # TVmaze client (TVMAZE_BASE_URL seam, request logs)
    index.ts          # barrel: searchShows
    tvmaze.ts
    tests/            # unit suite for the client
  tests/              # app-level suites (supertest against the exported app)
  tsconfig.json       # same strict compiler rules as the web workspace
  vitest.config.ts    # Vitest config (node environment)

e2e/                  # Playwright specs + local TVmaze stub
  smoke.spec.js       # E2E smoke test
  search.spec.js      # search through the backend + fail-next error flow
  cache.spec.js       # backend cache reuse + per-query caching
  browse.spec.js      # server-driven genre filtering + pagination
  stub/
    tvmaze.js         # fixture-backed search/shows stub, hit counter,
                      # per-query /__fail-next?q= one-shot failure control
    fixtures.json     # canned TVmaze responses
playwright.config.js  # E2E harness (stub + backend + frontend webServers)
```

ESLint, Prettier and husky/lint-staged stay at the repo root; the root scripts
forward to the workspaces (`npm run dev` -> `web`, `npm run server` ->
`server`).

## Testing

- `npm run test` runs the Vitest suites of both workspaces: `web/` uses jsdom
  with Testing Library, `server/` drives the exported Express app with
  supertest (no port is bound).
- `npm run test:e2e` runs the Playwright suite in `e2e/`. The config boots
  three servers first: the local TVmaze stub on port 3002, the backend with
  `TVMAZE_BASE_URL=http://localhost:3002` (so it talks to the stub instead of
  the real API) and the frontend dev server. The stub counts upstream hits
  per query (`GET /__hits`) so cache behavior is assertable, and one-shot
  failures can be armed per query with `POST /__fail-next?q=` for
  deterministic error flows.
- First-time setup: `npx playwright install chromium` downloads the browser
  binary (Playwright does not install it via npm).

## Styling

Styles use **CSS Modules** — one `Component.module.css` per component, imported
as the default export:

```tsx
import styles from './HomePage.module.css';

<section className={styles.hero}>…</section>;
```

Only `web/src/index.css` (reset) and `web/src/styles/tokens.css` (design tokens
as `:root` custom properties) are global. Always style with tokens — never
hard-code a colour, radius, spacing value or shadow:

```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  padding: var(--space-md);
  box-shadow: var(--shadow-card);
}
```

See `AGENTS.md` for the full conventions.
