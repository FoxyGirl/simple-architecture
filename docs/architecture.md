# Architecture

ScreenScout follows a **Simple Architecture** pattern.
Keep it in sync with the code.

## View/Presenter pattern

Components follow the View/Presenter pattern when presentation logic is encapsulated in the custom hook usePresenter (`use<Component>.js`).

### View

- MUST be responsible for rendering JSX.
- MUST NOT contain business logic, manage application state, perform side effects, fetch data, validate input, transform data, etc.
- MUST receive prepared data, derived values, handlers and actions from the corresponding hook usePresenter (`use<Component>.js`) when it's needed.
- MUST NOT perform business-level data processing, including filtering, sorting, aggregating, mapping API responses.
- MAY import child components, UI primitives from ui-kit, shared constants, utils, api and hooks.
- MAY use .map() to render prepared data, as well as conditional rendering and early returns to control the UI.
- MAY be purely presentational and does not require a usePresenter(`use<Component>.js`) hook when no behavior or data preparation is needed.

### Presenter

- MUST be implemented as a React hook.
- MUST have a descriptive name reflecting the component it serves: `use<Component>.js`.
- MUST be imported only by its own View. A presenter MUST NOT import another
  component's presenter: state and coordination shared by multiple components
  belong to the common ancestor's presenter, while shared derivations belong
  to pure utility functions.
- MUST encapsulate the presentation logic required by its associated View.
- MUST keep business logic, data fetching, and application state management.
- MUST prepare and expose all data, derived values, event handlers and actions needed by the View.
- MAY delegate specific responsibilities to smaller, specialized hooks and pure utility functions.
- SHOULD expose a minimal, explicit interface containing only what the View needs to render and handle user interaction.

### Public Contract

A View is published to its consumers through the `index.js` barrel of its
component directory. Only the View crosses the directory boundary — its
presenter, styles and helper modules stay private, so the View/Presenter
separation stays visible in the import graph.

- The `index.js` MUST re-export the View only.
- Consumers MUST import from the component directory (`./ShowCard`), never from
  the file inside it (`./ShowCard/ShowCard`).
- Shared pure helpers are published the same way: a `utils/` directory exposes
  its public helpers through its own `index.js`, and consumers import from the
  directory (`../utils`), never from a file inside it (`../utils/selection.js`).
- The barrel MUST contain re-exports only — it MUST NOT hold logic.
- See [Component Organization](component-organization.md) for the full barrel
  rules.

### Separation of Responsibilities

Presentation logic MUST be handled by the Presenter, while UI rendering decisions MUST remain in the View.

- The Presenter prepares data, computes derived values, and provides event handlers.
- The View determines how to render the prepared data, including conditional rendering, component composition, and UI states.
