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

Import specifiers carry no file extension. `~` aliases the frontend
`web/src/` root and `@server` aliases the `server/` root:

```ts
import { searchShowsPage } from '~/api/shows';
import { useMediaQuery } from '~/hooks/useMediaQuery';
import { formatShow } from '~/pages/utils/show-format';
import { getCachedShows } from '@server/cache';
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
web/          # frontend workspace: the Vite + React app
  src/        # app code: pages, components, store, api, styles, ui-kit
  scripts/    # CSS Module type declaration generator

server/       # backend workspace: the Express API
  routes/     # one folder per HTTP route (search, favorites)
  cache/      # 5-minute TVmaze response cache
  tvmaze/     # TVmaze client
  pagination/ # shared pagination helpers

e2e/          # Playwright specs + the local TVmaze stub
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
