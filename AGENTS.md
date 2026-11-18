# AGENTS.md

Guidance for AI agents (and humans) working in this repository.

## Project

**ScreenScout** — a React single-page app for browsing TV shows: search, filter by
genre, paginate results, and view show details.

The repository is an npm-workspaces monorepo with two packages: `web/`
(the React frontend) and `server/` (an Express backend serving the
`/api/search` endpoint: TVmaze proxying with a 5-minute cache, genre
filtering and pagination). Shared tooling (ESLint, Prettier, husky) lives at
the root; root scripts forward to the workspaces.

Stack:

| Concern  | Choice                                                                 |
| -------- | ---------------------------------------------------------------------- |
| Build    | Vite 7                                                                 |
| UI       | React 19                                                               |
| Language | TypeScript 6 (`strict`, `noUncheckedIndexedAccess`)                    |
| Routing  | React Router 7 (`react-router-dom`)                                    |
| State    | Redux Toolkit + react-redux (store and Entity in `web/src/store/`)     |
| Icons    | lucide-react                                                           |
| Classes  | clsx                                                                   |
| API      | Express backend (`server/`) proxying TVmaze; browser calls `/api` only |
| Backend  | Express 5 (`server/`, TypeScript ESM run with tsx, port 3001)          |
| Tests    | Vitest (both workspaces), supertest, Playwright (E2E)                  |
| Lint     | ESLint 9 (flat config) + typescript-eslint + `eslint-config-prettier`  |
| Format   | Prettier 3                                                             |
| Hooks    | husky 9 + lint-staged 17 (pre-commit)                                  |
| Design   | pen.dev canvas — `design/ScreenScout-design.pen`                       |

Node 24 / npm 11. Vite 7 requires Node 20.19+ or 22.12+.

## Commands

```bash
npm install          # installs deps and wires up husky via the "prepare" script
npm run dev          # frontend dev server on http://localhost:5173 (web workspace)
npm run server       # backend Express process on http://localhost:3001 (server workspace)
npm run build        # tsc -b && vite build -> web/dist/
npm run preview      # serve the production build
npm run typecheck    # tsc, no emit, in both workspaces (fails on type errors)
npm run css-types    # regenerate the CSS Module type declarations
npm run test         # Vitest suites of both workspaces (unit/integration)
npm run test:e2e     # Playwright E2E (boots stub + backend + frontend servers)
npm run lint         # eslint .            (fails on errors)
npm run lint:fix     # eslint . --fix
npm run format       # prettier --write .  (rewrites every file)
npm run format:check # prettier --check .  (read-only)
```

In `web/` tests live in a `tests/` folder inside the component folder they
cover (e.g. `web/src/pages/HomePage/tests/`, jsdom + Testing Library); the
backend follows the same rule — app-level suites live in `server/tests/`
(supertest against the exported Express app) and each backend folder keeps the
suite for its own code in `<folder>/tests/` (e.g.
`server/routes/search/tests/`). E2E specs and the local TVmaze stub (fixture-backed `search/shows`
with a per-query hit counter, `GET /__hits`) live in `e2e/`; the backend
reads its upstream base URL from `TVMAZE_BASE_URL` (default
`https://api.tvmaze.com`), which is how E2E points it at the stub. Playwright
does not download browsers via npm — run `npx playwright install chromium`
once on a fresh machine. Write tests before implementing a phase (red ->
green); all later phases of the caching feature rely on this harness.

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

## React Memoization

When working with React components and hooks, follow
the rules defined in `rules/react-memoization.md`.

## Design system workflow

`design/ScreenScout-design.pen` is a **pen.dev canvas** and the source of truth
for the visual design.

- **Never edit the `.pen` file directly** — it is encrypted. Use the pen.dev
  MCP tools (`execute`, `save`, `get_app_state`, `read_skill`) to change it.
- The canvas holds design tokens as variables and documents them in the
  `Design System` frame (`CSS VARIABLES` section). It mirrors
  `web/src/styles/tokens.css`.
- When you add or change a token, update **both** the canvas variable and
  `web/src/styles/tokens.css`, and keep the names and values identical. The
  canvas section is the human-readable reference; the CSS file is what the app
  reads.
- Read `pen.dev` skill docs (`read_skill`) before non-trivial canvas edits:
  `pen-schema.md`, `execute.md`, `design-system.md`, `code-website.md`.
- Keep the canvas document root clean: only screens, reusable component frames
  and browser nodes at the top level. Components on top, screens below.

## Git workflow

- **NEVER create a commit.** The user makes every commit themselves.
  Agents MUST NOT run `git commit` (or `git commit --amend`, `git rebase`,
  `git merge`, `git cherry-pick`, `git add`) unless the user explicitly asks for it in
  that same request. Leave the work staged or unstaged for them to commit.
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

- The app is written in TypeScript. In `web/`, `tsconfig.json` is a solution
  file that references `web/tsconfig.app.json` (the app + its tests) and
  `web/tsconfig.node.json` (the Vite and Vitest configs). `server/` has
  its own `server/tsconfig.json` with the same strict rules and the
  `bundler` module resolution, so extensionless specifiers work there too.
- The compiler runs in `strict` mode with `noUncheckedIndexedAccess`,
  `verbatimModuleSyntax` and `erasableSyntaxOnly`.
- Types live in a `types.ts` file next to the code that owns them —
  `web/src/api/types.ts` for the TVmaze shapes, a page's `types.ts` for the
  types shared inside that page.
- Object shapes are declared as `type` aliases, never as `interface`.
- Every CSS Module has a generated `<Component>.module.css.d.ts` giving each
  class a literal type — that is what makes
  `clsx(base, { [styles.modifier]: condition })` compile, and it turns a
  class-name typo into a compile error. The dev server regenerates them on
  every CSS change; `npm run typecheck` and `npm run build` do it before the
  compiler runs. `npm run css-types` runs it on demand.
- Import specifiers carry no file extension. The ESLint import resolver cannot
  map a `.js` specifier onto a `.ts` file.
- The backend has one import alias: `~` for the `server/` root, so route
  folders never write `../../` climbs. It is declared in `eslint.config.js`,
  `server/tsconfig.json` (`paths`) and `server/vitest.config.ts`
  (`resolve.alias`); `tsx` honours the tsconfig mapping at runtime.
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
- Line endings are normalised by `.gitattributes` (`* text=auto eol=lf`): the repo
  stores LF and every platform checks out LF. If you ever see CRLF creep back in,
  check that `.gitattributes` is present and that `core.autocrlf` is not
  overriding it — `git ls-files --eol` shows the index/worktree endings.
- `opencode` permission rules for this repo live in `.opencode.json`
