# AGENTS.md

Guidance for AI agents (and humans) working in this repository.

## Project

**ScreenScout** — a React single-page app for browsing TV shows: search, filter by
genre, paginate results, and view show details.

Stack:

| Concern | Choice                                            |
| ------- | ------------------------------------------------- |
| Build   | Vite 7                                            |
| UI      | React 19                                          |
| Routing | React Router 7 (`react-router-dom`)               |
| Lint    | ESLint 9 (flat config) + `eslint-config-prettier` |
| Format  | Prettier 3                                        |
| Hooks   | husky 9 + lint-staged 17 (pre-commit)             |
| Design  | pen.dev canvas — `design/ScreenScout-design.pen`  |

Node 24 / npm 11. Vite 7 requires Node 20.19+ or 22.12+.

## Commands

```bash
npm install          # installs deps and wires up husky via the "prepare" script
npm run dev          # dev server on http://localhost:5173
npm run build        # production build to dist/
npm run preview      # serve the production build
npm run lint         # eslint .            (fails on errors)
npm run lint:fix     # eslint . --fix
npm run format       # prettier --write .  (rewrites every file)
npm run format:check # prettier --check .  (read-only)
```

There is no test runner configured. If tests are needed, add Vitest — do not
assume one exists.

## Structure

```
src/
  main.jsx              # entry: StrictMode > BrowserRouter > App
  App.jsx               # layout + <Routes>; every route lives here
  App.module.css        # app-shell styles (nav, layout) — CSS Module
  index.css             # global reset + @import './styles/tokens.css'
  pages/Home.jsx        # route components, one file per page
  pages/Home.module.css # that page's styles — CSS Module
  styles/tokens.css     # ALL design tokens as CSS custom properties
design/
  ScreenScout-design.pen            # pen.dev canvas — encrypted, MCP only
  ScreenScout-design-assets/*.jpg   # poster art used by the canvas
```

## Conventions

### Components and routing

- `.jsx` for components, plain `.js` for config/scripts. ESM imports only.
- Function components, exported as **named exports**:
  `export const Home = () => { … };`
- Import them by name: `import { Home } from './pages/Home.jsx';`
  ESLint's `import-x/named` / `import-x/default` rules verify that the import
  matches the module's exports — if you rename an export, the lint fails
  instead of the app failing at runtime.
- Add new pages as `src/pages/<Name>.jsx` and register the route in
  `src/App.jsx`. `BrowserRouter` is already mounted in `main.jsx` — do not add
  another router.
- Keep the existing import style: relative path with the file extension
  included.

### Styling — CSS Modules + design tokens

**Every component styles itself with a CSS Module.** Vite handles `.module.css`
out of the box — no config needed.

- One `Component.module.css` per component, next to the component file
  (`src/App.module.css`, `src/pages/Home.module.css`).
- Import it as the default export and use it via `className`:

  ```jsx
  import styles from './Home.module.css';

  export default function Home() {
    return (
      <section className={styles.hero}>
        <h1 className={styles.title}>Home</h1>
      </section>
    );
  }
  ```

- Name classes in **camelCase** (`heroTitle`, not `hero-title`) so they are
  valid JS identifiers; access kebab-case names with `styles['hero-title']`.
- Class names are hashed at build time — never reference a module class from a
  global stylesheet or with a raw string (`className="hero"` will not match).
  Global styles are for element defaults, not for styling components.
- The only non-module CSS files are `src/index.css` (global reset) and
  `src/styles/tokens.css` (custom properties). Both must stay global —
  `:root` variables and element resets cannot be scoped to a module.

**Never hard-code a colour, radius, spacing value or shadow.** Read it from
`src/styles/tokens.css`:

```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  padding: var(--space-md);
  box-shadow: var(--shadow-card);
}
```

- Token groups: colours (`--bg`, `--surface`, `--accent`, `--text-*`,
  `--running`, `--star`, …), typography (`--font-display`, `--font-body`,
  `--weight-*`, `--leading-*`), radius, spacing, elevation, motion.
- `src/index.css` imports `tokens.css` first — keep that import first, CSS
  requires it.

### Fonts

Sora (display) and Inter (body) are loaded from Google Fonts in `index.html`.
Use `var(--font-display)` for headings and `var(--font-body)` for everything
else. For production, self-host with `@fontsource/sora` and `@fontsource/inter`.

### Code style

Prettier (`singleQuote`, 80 cols, 2 spaces, semicolons, trailing commas, LF)
and ESLint flat config. Notable ESLint rules:

- `no-unused-vars` is an error, but variables, arguments and caught errors
  prefixed with `_` are ignored.
- `import-x/no-unresolved` is an error — verify import paths.
- `import-x/named` and `import-x/default` are errors — the imported module
  must actually export what you import. They only work on files the plugin can
  parse, which is why `settings['import-x/extensions']` lists `.jsx`; keep that
  setting in sync when adding a new file type.
- `react/jsx-key` is a warning — every list needs stable keys.
- `react-refresh/only-export-components` warns if a component file exports
  non-component values (constants are allowed).

## Design system workflow

`design/ScreenScout-design.pen` is a **pen.dev canvas** and the source of truth
for the visual design.

- **Never edit the `.pen` file directly** — it is encrypted. Use the pen.dev
  MCP tools (`execute`, `save`, `get_app_state`, `read_skill`) to change it.
- The canvas holds design tokens as variables and documents them in the
  `Design System` frame (`CSS VARIABLES` section). It mirrors
  `src/styles/tokens.css`.
- When you add or change a token, update **both** the canvas variable and
  `src/styles/tokens.css`, and keep the names and values identical. The canvas
  section is the human-readable reference; the CSS file is what the app reads.
- Read `pen.dev` skill docs (`read_skill`) before non-trivial canvas edits:
  `pen-schema.md`, `execute.md`, `design-system.md`, `code-website.md`.
- Keep the canvas document root clean: only screens, reusable component frames
  and browser nodes at the top level. Components on top, screens below.

## Git workflow

- `dev` is the integration branch; `master` is the default branch on `origin`.
- Branch for work: `feat/<short-slug>` (e.g. `feat/base-Home-page`), `fix/…`,
  `chore/…`. Branch from `dev`, open a PR into `dev`; `dev` merges into
  `master`.
- Conventional Commits: `feat:`, `fix:`, `chore:`, `init:`, `refactor:`, `docs:`.
  Keep the subject short and imperative.
- The pre-commit hook runs `lint-staged` against **staged files only**:
  - `*.{js,jsx}` → `eslint --fix` + `prettier --write`
  - `*.{json,jsonc,css,md,html,yml,yaml}` → `prettier --write`
  - `package-lock.json` is excluded
- If husky is not installed (fresh clone, hooks skipped), run `npm run prepare`.

Fixable problems are repaired and the commit continues; unfixable errors
(e.g. `no-undef`) abort the commit.

## Gotchas

- Do not commit `node_modules/`, `dist/`, or `.vite/` — all gitignored.
- `.vite/` at the repo root is a stray Vite cache. Vite normally caches in
  `node_modules/.vite`; the root folder only appears when Vite runs while no
  `package.json` is visible at the root (e.g. on the `master` branch). It is
  gitignored — delete it, don't commit it.
- `npm run format` rewrites the whole repo, including files you did not touch.
  Prefer `npx prettier --write <files>` for scoped changes.
- Line endings are normalised by `.gitattributes` (`* text=auto eol=lf`): the repo
  stores LF and every platform checks out LF. If you ever see CRLF creep back in,
  check that `.gitattributes` is present and that `core.autocrlf` is not
  overriding it — `git ls-files --eol` shows the index/worktree endings.
- `opencode` permission rules for this repo live in `.opencode.json`.

## Before you commit

```bash
npm run lint && npx prettier --check <changed files>
```

Then stage and commit — the hook runs the rest.
