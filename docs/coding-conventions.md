# Coding Conventions

## TypeScript

The app is written in TypeScript. `tsc` runs in `strict` mode, and the
compiler options live in `tsconfig.app.json` (the app) and `tsconfig.node.json`
(the Vite config).

### Where types live

- MUST declare types in a `types.ts` file next to the code that owns them.
  `src/api/types.ts` holds the TVmaze API shapes, a page's `types.ts` holds
  the types shared inside that page's directory.
- MUST NOT duplicate a type in several places — import it from its owner.
- Component prop types are declared locally in the component file and are not
  exported; a component file exports the component only.
- MUST declare every object shape as a `type` alias, never as an `interface`:

  ```ts
  export type Show = {
    id: number;
    name: string;
  };
  ```

- Runtime constants stay in `constants.ts`. A union derived from a constant
  MUST be derived from the constant, never re-declared by hand:

  ```ts
  export const STATUS = {
    IDLE: 'idle',
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error',
  } as const;

  export type SearchStatus = (typeof STATUS)[keyof typeof STATUS];
  ```

### Imports

- MUST use `import type` for type-only imports — `verbatimModuleSyntax` is on
  and the compiler enforces it.
- MUST NOT write file extensions in import specifiers. The bundler resolution
  mode resolves them, and the ESLint import resolver cannot map a `.js`
  specifier onto a `.ts` file:

  ```ts
  import { searchShowsPage } from '@api/shows';
  import { useMediaQuery } from '@hooks/useMediaQuery';
  import { STATUS } from './constants';
  ```

### Syntax

- `erasableSyntaxOnly` is on: MUST NOT use `enum` or `namespace`. Use a plain
  object with `as const` and derive the union type from it.
- MUST narrow `unknown` values explicitly — a caught error is `unknown`:

  ```ts
  const isAbortError = (error: unknown): boolean =>
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'AbortError';
  ```

### CSS Modules

`vite/client` types `*.module.css` as a string index signature, so a class
lookup would widen to `string | undefined` under `noUncheckedIndexedAccess` —
and TypeScript forbids `undefined` as a computed property name, which is what
the `clsx` object form needs.

Every CSS Module therefore has a generated declaration next to it
(`<Component>.module.css.d.ts`) that gives each class a literal type. The
declaration wins over the `vite/client` wildcard, so:

- a class lookup is a literal type, usable as a computed property key;
- a typo in a class name is a compile error.

Run `npm run css-types` after changing a CSS Module. The declarations are also
regenerated automatically:

| When                          | What happens                               |
| ----------------------------- | ------------------------------------------ |
| `npm run dev`                 | on every CSS change, while the server runs |
| `npm run typecheck` / `build` | before the compiler runs                   |

The generated files are committed — do not edit them by hand.

```jsx
className={clsx(styles.chip, { [styles.chipActive]: isActive })}
```

## File Size and Modularity

- Application source files MUST NOT exceed 120 lines of code.
- When a file grows beyond this limit, consider splitting it into smaller modules with clear, cohesive responsibilities.
- Prefer meaningful abstractions that improve readability, reusability, or separation of concerns over code compression.
- Extract independent logic into dedicated hooks or utility functions when it improves code organization.
- MUST NOT introduce unnecessary abstractions, indirection, or additional files solely to meet the line limit.
- Generated UI-kit components and third-party code are exempt from this constraint.

Readability, maintainability, and clear separation of responsibilities MUST take priority over file size and the number of files.

## Styling — CSS Modules + design tokens

**Every component styles itself with a CSS Module.** Vite handles `.module.css`
out of the box — no config needed.

- One `Component.module.css` per component, next to the component file
  (`src/App.module.css`, `src/pages/HomePage/HomePage.module.css`).
- Import it as the default export and use it via `className`:

  ```jsx
  import styles from './HomePage.module.css';

  export const HomePage = () => (
    <section className={styles.hero}>
      <h1 className={styles.title}>Home</h1>
    </section>
  );
  ```

- Name classes in **camelCase** (`heroTitle`, not `hero-title`) so they are
  valid JS identifiers; access kebab-case names with `styles['hero-title']`.
- Class names are hashed at build time — never reference a module class from a
  global stylesheet or with a raw string (`className="hero"` will not match).
  Global styles are for element defaults, not for styling components.
- The only non-module CSS files are `src/index.css` (global reset) and
  `src/styles/tokens.css` (custom properties). Both must stay global —
  `:root` variables and element resets cannot be scoped to a module.

### Conditional class names — `clsx`

Use `clsx` to combine class names. Never build them with template strings or
string concatenation:

```jsx
import clsx from 'clsx';

import styles from './ShowCard.module.css';

<div className={clsx(styles.dot, statusClass)} />;
<div
  className={clsx(styles.pageButton, {
    [styles.pageButtonActive]: pageNumber === page,
  })}
/>;
```

- A single static class stays as-is — `className={styles.card}`.
- A conditional class MUST use the object form, where the class name is the
  computed key: `{ [styles.chipActive]: isActive }`.
- A class name that is not a literal CSS Module reference — one held in a
  variable or looked up in a map — is passed as a plain argument:
  `clsx(styles.dot, statusClass)`.
- Conditional and static classes are always passed as separate arguments, in
  base-then-modifier order.

**Always try to use CSS variables** from `src/styles/tokens.css`:

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
  `--weight-*`, `--leading-*`), radius (`--radius-btn`, `--radius-card`, …),
  layout (`--card-poster-aspect`, `--gutter`), spacing (`--space-2xs` …
  `--space-xl`), elevation (`--shadow-card`, `--focus-ring`), motion
  (`--duration-*`, `--ease-out`).
- `src/index.css` imports `tokens.css` first — keep that import first, CSS
  requires it.

## Fonts

Sora (display) and Inter (body) are loaded from Google Fonts in `index.html`.
Use `var(--font-display)` for headings and `var(--font-body)` for everything
else. For production, self-host with `@fontsource/sora` and `@fontsource/inter`.

## Import aliases

Imports that cross directory boundaries MUST use an alias instead of a deep relative path.

| Alias    | Target         | Example                                                 |
| -------- | -------------- | ------------------------------------------------------- |
| `@api`   | `src/api`      | `import { searchShowsPage } from '@api/shows';`         |
| `@hooks` | `src/hooks`    | `import { useMediaQuery } from '@hooks/useMediaQuery';` |
| `@store` | `src/store`    | `import { store } from '@store';`                       |
| `~`      | `server/` root | `import { getCachedShows } from '~/cache';`             |

- `@api`, `@hooks` and `@store` are frontend aliases; `~` is the backend
  alias and always
  resolves to the `server/` workspace root, so a route folder such as
  `server/routes/search/` writes `'~/cache'` and `'~/types'` instead of
  `'../../cache'` and `'../../types'`.
- Relative imports remain the default for files in the same directory or in a
  directly owned sibling component — and for a colocated `tests/` folder
  importing the private files of the folder it covers (`'../shows'`).
- Frontend aliases are declared in `vite.config.ts` (`resolve.alias`) and MUST
  be mirrored in `eslint.config.js` (alias resolver) and `tsconfig.app.json`
  (`compilerOptions.paths`, editor support).
- The backend alias `~` has no Vite config: it lives in `eslint.config.js`,
  `server/tsconfig.json` (`compilerOptions.paths`) and `server/vitest.config.ts`
  (`resolve.alias`). `tsx` reads the tsconfig mapping, so the running backend
  resolves `~` too.
- Every configuration that declares an alias MUST be kept in sync when an alias
  is added, renamed or removed.

## Code style

Prettier (`singleQuote`, 80 cols, 2 spaces, semicolons, trailing commas, LF)
and ESLint flat config. Notable ESLint rules:

- `no-unused-vars` is an error, but variables, arguments and caught errors
  prefixed with `_` are ignored. In TypeScript files the rule is
  `@typescript-eslint/no-unused-vars`, with the same ignore patterns.
- `import-x/no-unresolved` is an error — verify import paths.
- `import-x/named` and `import-x/default` are errors — the imported module
  must actually export what you import. They only work on files the plugin can
  parse, which is why `settings['import-x/extensions']` lists `.ts` and
  `.tsx`; keep that setting in sync when adding a new file type.
- `react/jsx-key` is a warning — every list needs stable keys.
- `react-hooks` recommended rules are errors — keep hook deps honest, and wrap
  callbacks in `useCallback` when they are passed to children or used in effect
  dependencies.
- `react-refresh/only-export-components` warns if a component file exports
  non-component values (constants are allowed).
- `max-lines` warns when a code file grows past 120 lines — split it into
  smaller modules. Every line counts, blank lines and comments included. It
  measures code files only (`.js`, `.jsx`, `.ts`, `.tsx`); Markdown, JSON, CSS
  and other non-code files are never measured.
