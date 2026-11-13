# Simple Architecture

A simple React app built with:

- [React 19](https://react.dev/)
- [TypeScript 6](https://www.typescriptlang.org/) (`strict`)
- [Vite 7](https://vite.dev/)
- [React Router 7](https://reactrouter.com/)
- [ESLint 9](https://eslint.org/) (flat config)
- [Prettier](https://prettier.io/)

## Scripts

| Command                | Description                          |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Start the dev server (port 5173)     |
| `npm run build`        | Typecheck, then build into `dist/`   |
| `npm run preview`      | Serve the production build           |
| `npm run typecheck`    | Typecheck with `tsc -b --noEmit`     |
| `npm run lint`         | Check with ESLint                    |
| `npm run lint:fix`     | Auto-fix ESLint issues               |
| `npm run format`       | Format files with Prettier           |
| `npm run format:check` | Check formatting with Prettier       |
| `npm run prepare`      | Install husky git hooks (on install) |

## TypeScript

`tsconfig.json` is a solution file that references two projects:

- `tsconfig.app.json` — the application code in `src/`
- `tsconfig.node.json` — the Vite config

The compiler runs in `strict` mode with `noUncheckedIndexedAccess`,
`verbatimModuleSyntax` and `erasableSyntaxOnly`. Types live in a `types.ts`
file next to the code that owns them.

Import specifiers carry no file extension:

```ts
import { searchShows } from '@api/tvmaze';
import { useMediaQuery } from '@hooks/useMediaQuery';
```

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

```
src/
  main.tsx        # Entry point, mounts <App /> inside BrowserRouter
  App.tsx         # Layout + route definitions
  App.module.css  # App shell styles (CSS Module)
  index.css       # Global reset + token import
  vite-env.d.ts   # Vite client types (CSS Modules, import.meta.env)
  api/
    tvmaze.ts     # TVmaze REST client
    types.ts      # TVmaze API shapes
  hooks/
    useMediaQuery.ts
  pages/
    HomePage/
      HomePage.tsx        # "/" route
      useHomePage.ts      # page presenter
      HomePage.module.css # Page styles (CSS Module)
      index.ts            # public export
  styles/
    tokens.css    # Design tokens as CSS custom properties
  ui-kit/         # Shared, project-wide UI components
```

## Styling

Styles use **CSS Modules** — one `Component.module.css` per component, imported
as the default export:

```tsx
import styles from './HomePage.module.css';

<section className={styles.hero}>…</section>;
```

Only `src/index.css` (reset) and `src/styles/tokens.css` (design tokens as
`:root` custom properties) are global. Always style with tokens — never
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
