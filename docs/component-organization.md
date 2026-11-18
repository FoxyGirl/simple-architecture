# Component Organization and Ownership

Readability, maintainability, and clear component ownership MUST take priority over minimizing the number of files.

The directory structure MUST reflect the UI component hierarchy and component ownership.

## Directory Structure

- Every application component MUST have its own directory.
- Component directories MUST follow the UI hierarchy and reflect component ownership.
- Component-specific hooks, utilities, styles, and assets SHOULD be colocated with their owning component.
- MUST NOT introduce unnecessary directory nesting that does not reflect component ownership or logical organization.

## Component Reuse and Placement

The `components/` directory at each level is reserved for reusable application components on the current level. Component placement MUST reflect its actual reuse scope.

- Components used exclusively by a single parent MUST reside directly in that parent's directory.
- Components shared within a UI subtree SHOULD reside in the `components/` directory of their nearest common ancestor.
- Components shared across unrelated UI subtrees MAY reside in the global `src/ui-kit/` directory.
- Components MUST be placed at the lowest level of the directory hierarchy that satisfies their reuse requirements.
- MUST NOT introduce shared abstractions or broaden component scope without a concrete reuse requirement.
- Reusable application components MUST follow the same View/Presenter principles as other components.

## Component File Structure

Every component outside `src/ui-kit/` — a page, a feature component or a subcomponent — MUST follow the same predictable file layout, mirroring the layout documented for `src/ui-kit/`.

- MUST reside in its own directory, named after the component.
- MUST expose the component through `index.ts`.
- MUST keep its styles in `<Component>.module.css` next to the component (CSS Module).
- MUST include usePresenter (`use<Component>.ts`) only when the component needs behavior or data preparation; a purely presentational component MUST NOT have one.
- MAY colocate additional component-specific files (`constants.ts`, `types.ts`, `utils.ts`, assets) in the same directory.

### `src/ui-kit/` — shared UI components

The global `src/ui-kit/` directory is reserved for common UI components that are reused across the whole project — `Button`, `Tooltip`, `IconButton`, form controls and similar primitives.

- MUST contain only such project-wide reusable UI components.
- MUST NOT contain application-specific components — those stay with the page or feature that owns them.
- MUST NOT be used as a place to park code without an owner; a component moves to `src/ui-kit/` only when it has a concrete cross-project reuse requirement.
- MUST follow the same View/Presenter principles as any other component: its own directory with `<Component>.tsx` + `<Component>.module.css`, and a `use<Component>.ts` only when it needs behavior or data preparation.
- MUST stay presentational: no business rules and no knowledge of a specific page or feature — content, state and handlers come in through props.

### Nested components

Every additional component needed by a component MUST live inside that component's own directory, each one in its own directory named after it.

- MUST NOT group component-owned children into a `components/` folder.
- MUST NOT place a single-owner child in a `components/` folder — it belongs directly in its owner's directory.
- The `components/` folder is reserved for components reused by multiple descendants of the current folder.

## Component Exports — `index.ts`

Every component directory MUST publish its component through an `index.ts`
barrel file. The barrel is the public surface of the directory.

- Every component directory MUST contain an `index.ts` that re-exports the
  component: `export { ShowCard } from './ShowCard.tsx';`.
- Every helper directory (for example `utils/`) MUST contain an `index.ts` that
  re-exports its public helpers: `export { filterShowsByGenre } from
'./genres.ts';`.
- The barrel file MUST be named `index.ts` — not `index.tsx`.
- Consumers MUST import from a directory (`import { ShowCard } from
'./ShowCard';`, `import { resolveSelection } from '../utils';`) and MUST NOT
  reach into the files inside it (`./ShowCard/ShowCard`, `../utils/selection.ts`).
- The barrel of a component directory MUST export the component only.
  Presenters (`use<Component>.ts`), styles, constants and helper modules stay
  private to their directory.
- A barrel MUST contain re-exports only — it MUST NOT hold logic.
- A parent barrel MUST export the parent's component only. Siblings are still
  imported through their own barrels, never through the parent's.

### File Structure Example

```
<Page>/
├── <Page>.tsx                   # Page View
├── <Page>.module.css            # Page styles
├── constants.ts                 # Page-specific constants
├── types.ts                     # Page-specific types
├── index.ts                     # Public entry point; exports the Page View only
│
├── logic/
│   ├── use<Page>.ts             # Page Presenter; prepares data and handlers for the Page View
│   │
│   └── tasks/                   # Tasks shared by multiple components within this Page
│       ├── taskA.ts
│       └── taskB.ts
│
├── utils/
│   ├── helperA.ts               # Pure utility functions shared within the Page
│   ├── helperB.ts
│   └── index.ts                 # Public entry point for shared utilities
│
├── components/                  # Components shared by multiple components within the Page
│   │
│   └── <SharedComponent>/       # Shared by multiple descendants (<Component1> and <Component2>)
│       ├── <SharedComponent>.tsx
│       ├── <SharedComponent>.module.css
│       └── index.ts             # Exports the component View only
│
├── <Component1>/
│   ├── <Component1>.tsx         # Component1 View
│   ├── <Component1>.module.css  # Component1 styles
│   ├── constants.ts             # Component1-specific constants
│   ├── types.ts                 # Component1-specific types
│   ├── index.ts                 # Public entry point; exports the Component1 View only
│   │
│   ├── logic/
│   │   ├── use<Component1>.ts   # Component1 Presenter
│   │   │
│   │   └── tasks/               # Tasks used exclusively by Component1
│   │       ├── taskA.ts
│   │       └── taskB.ts
│   │
│   ├── components/              # Components used exclusively by Component1
│   │   │
│   │   ├── <SharedComponent>/
│   │   │   ├── <SharedComponent>.tsx
│   │   │   ├── <SharedComponent>.module.css
│   │   │   └── index.ts         # Presentational component; no Presenter required
│   │   │
│   │   ├── <SubComponent1>/
│   │   │   ├── <SubComponent1>.tsx
│   │   │   ├── <SubComponent1>.module.css
│   │   │   └── index.ts         # Presentational component; receives data and handlers through props
│   │   │
│   │   └── <SubComponent2>/
│   │       ├── <SubComponent2>.tsx
│   │       ├── <SubComponent2>.module.css
│   │       ├── index.ts
│   │       │
│   │       └── logic/
│   │           └── use<SubComponent2>.ts
│   │                            # SubComponent2 Presenter; added because this component has its own presentation logic
│   │
│   └── utils/                   # Pure utility functions used exclusively by Component1
│       ├── helperA.ts
│       └── index.ts
│
└── <Component2>/
    ├── <Component2>.tsx         # Component2 View
    ├── <Component2>.module.css  # Component2 styles
    ├── constants.ts
    ├── types.ts
    ├── index.ts                 # Public entry point; exports the Component2 View only
    │
    ├── logic/
    │   ├── use<Component2>.ts   # Component2 Presenter
    │   │
    │   └── tasks/               # Tasks used exclusively by Component2
    │       └── taskA.ts
    │
    └── components/              # Components used exclusively by Component2
        │
        └── <SubComponent>/
            ├── <SubComponent>.tsx
            ├── <SubComponent>.module.css
            └── index.ts         # Presentational component; no Presenter required
```

### Structure rules

- A component MUST have a `logic/` folder only if it requires its own Presenter or component-specific Tasks.
- A Presenter MUST be located in the `logic/` folder of its associated component.
- Tasks used exclusively by a component MUST be placed in its `logic/tasks/` folder.
- Tasks shared by multiple components MUST be placed in the `tasks/` folder at their nearest common ancestor level.
- Purely presentational components MUST NOT have an unnecessary `logic/` folder.
- Components without a Presenter MUST receive all required data, values, and handlers through props.
- A component's `index.ts` MUST export its View only. Internal implementation details MUST remain private.
- Shared pure utility functions MUST be placed in the nearest appropriate `utils/` folder and exported through its `index.ts`.

## Backend (`server/`) organization

The Express workspace mirrors the same ownership rules: every folder publishes
itself through an `index.ts` barrel, and consumers import from the directory,
never from a file inside it.

- Every HTTP route MUST live in its own folder under `routes/`, named after the
  route (e.g. `routes/search/`).
- A route folder MUST expose its Express router through `index.ts`; the router
  module (`<route>.ts`) and the route's private helpers (e.g. `shows.ts`) stay
  inside the folder and MUST NOT be imported from outside it.
- Helpers used exclusively by one route MUST reside in that route's folder;
  helpers reused by several routes MUST move to the nearest common ancestor's
  folder.
- `routes/index.ts` MUST be a pure barrel re-exporting every route's router.
- `app.ts` is the single composition point: it creates the Express app and
  mounts the routers from `routes/` under `/api`. Route handlers MUST NOT be
  defined in `app.ts`.
- Backend modules shared by several routes (e.g. `cache/`, `tvmaze/`) MUST have
  their own folder with an `index.ts` barrel exposing their public API.
- Shared TVmaze API shapes stay in `server/types.ts`; types owned by a single
  route live in that route's folder.
- Tests follow the frontend rule: each folder keeps the suite for its own code
  in a `tests/` subfolder (e.g. `server/routes/search/tests/`), and suites that
  drive the whole exported app live in `server/tests/`. A colocated suite MAY
  import the private files of the folder it covers.

```

```
