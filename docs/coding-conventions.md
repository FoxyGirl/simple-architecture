# Coding Conventions

## TypeScript

The app is written in TypeScript. `tsc` runs in `strict` mode with
`noUncheckedIndexedAccess`, and the compiler options live in `tsconfig.app.json`
(the app) and `tsconfig.node.json` (the Vite config).

### Where types live

- MUST declare types in a `types.ts` file next to the code that owns them.
  `src/api/types.ts` holds the TVmaze API shapes, a page's `types.ts` holds
  the types shared inside that page's directory.
- MUST NOT duplicate a type in several places — import it from its owner.
- Component prop types are declared locally in the component file and are not
  exported; a component file exports the component only.
- Runtime constants stay in `constants.ts`. A union derived from a constant
  MUST be derived from the constant, never re-declared by hand:

  ```ts
  export const STATUS = Object.freeze({
    IDLE: 'idle',
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error',
  } as const);

  export type SearchStatus = (typeof STATUS)[keyof typeof STATUS];
  ```

### Imports

- MUST use `import type` for type-only imports — `verbatimModuleSyntax` is on
  and the compiler enforces it.
- MUST NOT write file extensions in import specifiers. The bundler resolution
  mode resolves them, and the ESLint import resolver cannot map a `.js`
  specifier onto a `.ts` file:

  ```ts
  import { searchShows } from '@api/tvmaze';
  import { useMediaQuery } from '@hooks/useMediaQuery';
  import { STATUS } from './constants';
  ```

### Syntax

- `erasableSyntaxOnly` is on: MUST NOT use `enum` or `namespace`. Use a frozen
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

`src/vite-env.d.ts` references `vite/client`, so a CSS Module import is typed
as a record of class names. Because `noUncheckedIndexedAccess` is on, that
lookup yields `string | undefined` — which MUST NOT be used as a computed
property name. Express conditional classes with `clsx` instead:

```jsx
className={clsx(styles.chip, isActive && styles.chipActive)}
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
  className={clsx(
    styles.pageButton,
    pageNumber === page && styles.pageButtonActive,
  )}
/>;
```

- A single static class stays as-is — `className={styles.card}`.
- `clsx` skips `false`, `undefined` and `null` entries, so conditional
  modifiers are passed as `condition && styles.modifier`.
- Conditional and static classes are always passed as separate arguments, in
  base-then-modifier order.
- MUST NOT use a CSS Module class as a computed property name — see
  [TypeScript](#typescript).

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

| Alias    | Target      | Example                                                 |
| -------- | ----------- | ------------------------------------------------------- |
| `@api`   | `src/api`   | `import { searchShows } from '@api/tvmaze';`            |
| `@hooks` | `src/hooks` | `import { useMediaQuery } from '@hooks/useMediaQuery';` |

- Relative imports remain the default for files in the same directory or in a
  directly owned sibling component.
- Aliases are declared in `vite.config.ts` (`resolve.alias`) and MUST be
  mirrored in `eslint.config.js` (alias resolver) and `tsconfig.app.json`
  (`compilerOptions.paths`, editor support).
- The three configurations MUST be kept in sync when an alias is added,
  renamed or removed.

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
