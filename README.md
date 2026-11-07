# Simple Architecture

A simple React app built with:

- [React 19](https://react.dev/)
- [Vite 7](https://vite.dev/)
- [React Router 7](https://reactrouter.com/)
- [ESLint 9](https://eslint.org/) (flat config)
- [Prettier](https://prettier.io/)

## Scripts

| Command                | Description                          |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Start the dev server (port 5173)     |
| `npm run build`        | Production build into `dist/`        |
| `npm run preview`      | Serve the production build           |
| `npm run lint`         | Check with ESLint                    |
| `npm run lint:fix`     | Auto-fix ESLint issues               |
| `npm run format`       | Format files with Prettier           |
| `npm run format:check` | Check formatting with Prettier       |
| `npm run prepare`      | Install husky git hooks (on install) |

## Git hooks

[husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/lint-staged/lint-staged) run
on every commit, against **staged files only**:

| Staged file type                             | Tasks                              |
| -------------------------------------------- | ---------------------------------- |
| `*.js`, `*.jsx`                              | `eslint --fix`, `prettier --write` |
| `*.json`, `*.css`, `*.md`, `*.html`, `*.yml` | `prettier --write`                 |

Fixable problems are repaired automatically and the commit continues;
unfixable errors (e.g. `no-undef`) **abort the commit**. Husky installs itself
via the `prepare` script, so `npm install` wires up the hooks automatically.

## Structure

```
src/
  main.jsx        # Entry point, mounts <App /> inside BrowserRouter
  App.jsx         # Layout + route definitions
  App.css         # Component styles
  index.css       # Global styles
  pages/
    Home.jsx      # "/" route
    About.jsx     # "/about" route
```
