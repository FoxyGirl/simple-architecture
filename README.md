# Simple Architecture

A simple React app built with:

- [React 19](https://react.dev/)
- [Vite 7](https://vite.dev/)
- [React Router 7](https://reactrouter.com/)
- [ESLint 9](https://eslint.org/) (flat config)
- [Prettier](https://prettier.io/)

## Scripts

| Command                | Description                      |
| ---------------------- | -------------------------------- |
| `npm run dev`          | Start the dev server (port 5173) |
| `npm run build`        | Production build into `dist/`    |
| `npm run preview`      | Serve the production build       |
| `npm run lint`         | Check with ESLint                |
| `npm run lint:fix`     | Auto-fix ESLint issues           |
| `npm run format`       | Format files with Prettier       |
| `npm run format:check` | Check formatting with Prettier   |

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
