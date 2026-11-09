# Coding Conventions

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

## Code style

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
- `react-hooks` recommended rules are errors — keep hook deps honest, and wrap
  callbacks in `useCallback` when they are passed to children or used in effect
  dependencies.
- `react-refresh/only-export-components` warns if a component file exports
  non-component values (constants are allowed).
- `max-lines` warns when a code file grows past 120 lines — split it into
  smaller modules. Every line counts, blank lines and comments included. It
  measures code files only (`.js`, `.jsx`, `.ts`, `.tsx`); Markdown, JSON, CSS
  and other non-code files are never measured.
