# AGENTS.md

Guidance for AI agents (and humans) working in this repository.

## Project

**ScreenScout** — a React single-page app for browsing TV shows: search, filter by
genre, paginate results, and view show details.

Stack:

| Concern  | Choice                                                                |
| -------- | --------------------------------------------------------------------- |
| Build    | Vite 7                                                                |
| UI       | React 19                                                              |
| Language | TypeScript 6 (`strict`, `noUncheckedIndexedAccess`)                   |
| Routing  | React Router 7 (`react-router-dom`)                                   |
| Icons    | lucide-react                                                          |
| Classes  | clsx                                                                  |
| API      | TVmaze REST (`https://api.tvmaze.com`) via fetch                      |
| Lint     | ESLint 9 (flat config) + typescript-eslint + `eslint-config-prettier` |
| Format   | Prettier 3                                                            |
| Hooks    | husky 9 + lint-staged 17 (pre-commit)                                 |
| Design   | pen.dev canvas — `design/ScreenScout-design.pen`                      |

Node 24 / npm 11. Vite 7 requires Node 20.19+ or 22.12+.

## Commands

```bash
npm install          # installs deps and wires up husky via the "prepare" script
npm run dev          # dev server on http://localhost:5173
npm run build        # tsc -b && vite build -> dist/
npm run preview      # serve the production build
npm run typecheck    # tsc -b --noEmit    (fails on type errors)
npm run lint         # eslint .            (fails on errors)
npm run lint:fix     # eslint . --fix
npm run format       # prettier --write .  (rewrites every file)
npm run format:check # prettier --check .  (read-only)
```

There is no test runner configured. If tests are needed, add Vitest — do not
assume one exists.

## Project Documentation

Project documentation defines the mandatory rules and conventions
for implementing and modifying the application.

**Before making any changes, you MUST read and follow all relevant
documentation.**

- [Architecture](docs/architecture.md) — application architecture,
  View/Presenter pattern, component responsibilities, and data flow.
- [Component Organization](docs/component-organization.md) —
  component directory structure, ownership, reuse rules.
- [Coding Conventions](docs/coding-conventions.md) —
  styling, design tokens, fonts, naming conventions, and implementation rules.

### Compliance Rules

- Treat the documentation as the source of truth for implementation decisions.
- Do not introduce patterns, structures, or conventions that contradict
  the documented rules.
- When modifying existing code, preserve consistency with the documented
  architecture and conventions.
- If a requirement is unclear, documentation is incomplete, or a proposed
  change conflicts with existing rules, ask for clarification before proceeding.
- Do not silently deviate from documented rules, even if an alternative
  implementation seems more convenient.

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
  - `*.{js,jsx,ts,tsx}` → `eslint --fix` + `prettier --write`
  - `*.{json,jsonc,css,md,html,yml,yaml}` → `prettier --write`
  - `package-lock.json` is excluded
- If husky is not installed (fresh clone, hooks skipped), run `npm run prepare`.

Fixable problems are repaired and the commit continues; unfixable errors
(e.g. `no-undef`) abort the commit.

## TypeScript

- The app is written in TypeScript. `tsconfig.json` is a solution file that
  references `tsconfig.app.json` (the app) and `tsconfig.node.json`
  (the Vite config).
- The compiler runs in `strict` mode with `noUncheckedIndexedAccess`,
  `verbatimModuleSyntax` and `erasableSyntaxOnly`.
- Types live in a `types.ts` file next to the code that owns them —
  `src/api/types.ts` for the TVmaze shapes, a page's `types.ts` for the types
  shared inside that page.
- Import specifiers carry no file extension. The ESLint import resolver cannot
  map a `.js` specifier onto a `.ts` file.
- Run `npm run typecheck` before committing — `npm run build` runs the same
  check as its first step.

## Gotchas

- Do not commit `node_modules/`, `dist/`, `.vite/` or `*.tsbuildinfo` — all
  gitignored.
- `.vite/` at the repo root is a stray Vite cache. Vite normally caches in
  `node_modules/.vite`; the root folder only appears when Vite runs while no
  `package.json` is visible at the root (e.g. on the `master` branch). It is
  gitignored — delete it, don't commit it.
- `npm run format` rewrites the whole repo, including files you did not touch.
  Prefer `npx prettier --write <files>` for scoped changes.
- A CSS Module class is typed as `string | undefined` (index signature plus
  `noUncheckedIndexedAccess`), so it cannot be used as a computed property
  name — use `clsx(base, condition && styles.modifier)`.
- Line endings are normalised by `.gitattributes` (`* text=auto eol=lf`): the repo
  stores LF and every platform checks out LF. If you ever see CRLF creep back in,
  check that `.gitattributes` is present and that `core.autocrlf` is not
  overriding it — `git ls-files --eol` shows the index/worktree endings.
- `opencode` permission rules for this repo live in `.opencode.json`
