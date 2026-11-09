# Architecture

ScreenScout follows a **Simple Architecture** pattern.
Keep it in sync with the code.

## View/Presenter pattern

Components follow the View/Presenter pattern when presentation logic is encapsulated in the custom hook usePresenter.

### View

- MUST be responsible for rendering JSX.
- MUST NOT contain business logic, manage application state, perform side effects, fetch data, validate input, transform data, etc.
- MUST receive prepared data, derived values, handlers and actions from the corresponding hook usePresenter when it's needed.
- MUST NOT perform business-level data processing, including filtering, sorting, aggregating, mapping API responses.
- MAY import child components, UI primitives from ui-kit, shared constants, utils, api and hooks.
- MAY use .map() to render prepared data, as well as conditional rendering and early returns to control the UI.
- MAY be purely presentational and does not require a usePresenter hook when no behavior or data preparation is needed.

### Presenter

- MUST be implemented as a React hook.
- MUST have a descriptive name reflecting the component it serves: usePresenter<Component>.js.
- MUST encapsulate the presentation logic required by its associated View.
- MUST keep business logic, data fetching, and application state management.
- MUST prepare and expose all data, derived values, event handlers and actions needed by the View.
- MAY delegate specific responsibilities to smaller, specialized hooks and pure utility functions.
- SHOULD expose a minimal, explicit interface containing only what the View needs to render and handle user interaction.

### Separation of Responsibilities

Presentation logic MUST be handled by the Presenter, while UI rendering decisions MUST remain in the View.

- The Presenter prepares data, computes derived values, and provides event handlers.
- The View determines how to render the prepared data, including conditional rendering, component composition, and UI states.
