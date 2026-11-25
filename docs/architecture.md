# Architecture

ScreenScout follows a **Simple Architecture** pattern.
Architecture documentation MUST define the rules and principles governing code organization, implementation, and placement.
All code MUST comply with the documented architecture.

## VIPER pattern (View/Interactor/Presenter/Entity/Router)

Components follow the View/Presenter pattern when presentation logic is encapsulated in the custom hook usePresenter (`use<Component>.ts`).

### View

- MUST be responsible for rendering JSX.
- MUST NOT contain business logic, manage application state, perform side effects, fetch data, validate input, transform data, etc.
- MUST receive prepared data, derived values, handlers and actions from the corresponding hook usePresenter (`use<Component>.ts`) when it's needed.
- MUST NOT perform business-level data processing, including filtering, sorting, aggregating, mapping API responses.
- MUST NOT access Redux Store directly or use application-level hooks for data fetching, state management, or side effects. It MUST delegate these responsibilities to its Presenter.
- MAY import child components, UI primitives from ui-kit, shared constants, utils, api and hooks.
- MAY use .map() to render prepared data, as well as conditional rendering and early returns to control the UI.
- MAY be purely presentational and does not require a usePresenter(`use<Component>.ts`) hook when no behavior or data preparation is needed.

### Presenter

Presenter is responsible for presentation logic, application state coordination, and orchestrating interactions between the View and Tasks.

- MUST be implemented as a React custom hook.
- MUST have a descriptive name reflecting the component it serves: `use<Component>.ts`.
- MUST be placed inside the component's `logic` folder.
- MUST be imported only by its associated View. A Presenter MUST NOT import another component's Presenter.
- MUST encapsulate all presentation logic required by its associated View.
- MUST prepare and expose all data, derived values, event handlers, and actions needed by the View.
- MUST manage component-level state required for presentation purposes, such as loading, submitting, and UI interaction states.
- MUST hold the request-scoped metadata of a fetched page — for example its
  page and page count for pagination — as component-level state.
- MUST coordinate application state by consuming data from the Redux Store through selectors.
- MUST orchestrate business operations and data fetching by invoking Tasks.
- MUST determine when and under which conditions Tasks should be executed, based on component lifecycle and user interactions.
- MUST handle the presentation-related consequences of Task execution, including loading states, error states, and updating the View.
- MUST NOT implement business logic or duplicate business rules encapsulated in Tasks.
- MUST NOT perform data fetching directly or make HTTP requests. All data fetching MUST be initiated through Tasks.
- MUST NOT dispatch Redux actions directly. Redux state mutations MUST be performed by Tasks using `store.dispatch`.
- MUST NOT contain low-level implementation details of business operations.
- MAY delegate specific responsibilities to smaller, specialized hooks and pure utility functions.
- SHOULD expose a minimal, explicit interface containing only what the View needs to render and handle user interactions.
- MUST use the Router for navigation. Navigation decisions and actions MUST be handled at the Presenter level.
- MUST obtain application data from Entity through Redux selectors.
- MUST pass all required data to Tasks explicitly through function arguments.
- MUST NOT delegate application state reading to Tasks.

### Interactor / Task

Task is an implementation of a business operation or user-system interaction scenario. It encapsulates business logic and executes operations independently of React and the View layer. A Task is the only place where a business operation meets the shared request layer and the Entity: the Presenter decides when an operation runs, the Task decides how it completes.

- We use the term `Task` to refer to an Interactor in the current architecture.
- MUST be implemented as an ordinary JavaScript/TypeScript function, not a React component or hook.
- MUST have a descriptive name reflecting the business operation or interaction scenario it implements.
- MUST start with a verb that names the operation — `fetchShowsPage`, `syncFavoritesSummary`, `toggleShowFavorite`. Noun and gerund phrases name Entities or Presenters, never Tasks.
- MUST live in a file named after the exported Task (`fetchShowsPage.ts`). A Task file MAY also export a tightly coupled control for the same operation (for example `abortShowsFetch`), but MUST NOT collect unrelated operations.
- MUST be placed inside a `tasks` folder within the `logic` folder. E.g. `/<Component>/logic/tasks`.
- Reusable Tasks shared across multiple components MUST be placed in a `tasks` directory at the nearest common ancestor level of those components.
- MUST encapsulate a single high-level business operation or user-system interaction scenario.
- MUST represent an operation at a high level of abstraction, hiding low-level implementation details from the Presenter.
- MUST contain all business logic required to execute its operation.
- MUST handle data fetching when it is part of the operation.
- MUST delegate HTTP requests and low-level network communication to the shared API request layer (`api/request.ts`).
- MUST compose the endpoint-specific request — path, query parameters, method and JSON body — inside the Task.
- MUST NOT add per-endpoint API modules: `api/` contains only the common request plumbing (`config.ts`, `errors.ts`, `request.ts`).
- MUST use `store.dispatch` directly when application state needs to be updated.
- MUST store the payload the backend returned when the backend owns the data, instead of merging or recomputing it from client-side state.
- MUST NOT depend on Redux Hooks.
- MUST NOT use React Hooks or depend on React components, component lifecycle, or React Context.
- MUST receive all required application data through explicit function arguments.
- MUST NOT read application state directly from the Redux Store.
- MUST NOT use `store.getState()` or Redux selectors to retrieve application data.
- MUST NOT depend on Views or Presenters.
- MUST NOT contain presentation logic, UI state, navigation, or UI-related side effects.
- MUST NOT call `fetch` directly; the shared request layer owns the transport, so a Task composes the request and delegates the call.
- MAY contain private helper functions (subtasks) to decompose its implementation; endpoint helpers MUST stay private to the Task file.
- MAY own non-application coordination state in module scope — for example the `AbortController` of the newest in-flight request. Such coordination state MUST NOT be stored in Redux.
- MUST treat a superseded or cancelled run as a distinct outcome (`status: 'aborted'`) and MUST NOT dispatch a stale response into the Entity.
- MAY be asynchronous.
- MUST catch expected failures and return them as part of the result instead of throwing across the Task boundary.
- MUST expose a clear function interface, accepting only the input data required to execute the operation.
- SHOULD return the result of the operation when it is needed by the Presenter.
- MUST return a discriminated outcome — `{ status: 'success', ... } | { status: 'error', message }` — when the Presenter reacts to the result, normalizing the caught error into `message` (`toErrorMessage`).
- MUST NOT translate an outcome into user feedback: the Task reports the message, the Presenter decides whether it becomes a toast, an error panel or a log.
- SHOULD declare the outcome type in the `types.ts` of the folder that owns the Task and reuse a shared type instead of redeclaring an identical shape.
- SHOULD be covered by a colocated suite that stubs the shared request boundary (`requestJson`), proving the Task runs without React and without a live server.

### Entity

Entity represents the application data layer and is implemented using Redux Toolkit.

It is responsible for storing, managing, and providing access to application data through the Redux Store.

- MUST use Redux Toolkit for application state management.
- MUST own and maintain the application data stored in the Redux Store.
- MUST store backend-owned payloads verbatim (for example the favorite ids,
  and the shows and total count of the fetched favorites page), and MUST NOT
  store request-scoped pagination metadata (the page and page count) — the
  Presenter owns that.
- MUST expose data to Presenters through Redux selectors.
- MUST provide actions and reducers for updating application state.
- MUST define and maintain the types of its state and data models.
- MUST encapsulate state-related logic, including reducers and selectors.
- MUST be independent of React components and the View layer.
- MUST NOT contain presentation logic or UI-related state.
- MUST NOT depend on Presenters, Views, or Tasks.
- MUST NOT perform navigation or UI-related side effects.
- MUST expose a clear public API for accessing and updating its data.

### Router

Router is navigation.

- Navigation MUST be initiated and coordinated at the Presenter level.
- Views MUST NOT directly interact with the routing library.

### Public Contract

A View is published to its consumers through the `index.ts` barrel of its
component directory. Only the View crosses the directory boundary — its
presenter, styles and helper modules stay private, so the View/Presenter
separation stays visible in the import graph.

- The `index.ts` MUST re-export the View only.
- Consumers MUST import from the component directory (`./ShowCard`), never from
  the file inside it (`./ShowCard/ShowCard`).
- Shared pure helpers are published the same way: a `utils/` directory exposes
  its public helpers through its own `index.ts`, and consumers import from the
  directory (`../utils`), never from a file inside it (`../utils/selection.ts`).
- The barrel MUST contain re-exports only — it MUST NOT hold logic.
- See [Component Organization](component-organization.md) for the full barrel
  rules.

### Separation of Responsibilities

Presentation logic MUST be handled by the Presenter, while UI rendering decisions MUST remain in the View.

- The Presenter prepares data, computes derived values, and provides event handlers.
- The View determines how to render the prepared data, including conditional rendering, component composition, and UI states.

### Minimal Interface Contract

The rules below govern two contracts: the View ↔ its Presenter
(`use<Component>.ts`), and the Presenter ↔ the internal hooks it composes.

#### View ↔ Presenter

1. The Presenter exposes ONE explicit object; the View destructures from it
   only the fields it renders or wires to the DOM. A field no consumer reads
   MUST NOT be part of the interface.
2. The Presenter accepts the values it needs from the View's props as ONE
   typed parameter object; the View forwards its props verbatim and never
   pre-processes them for the Presenter.
3. Every value the View branches on MUST arrive prepared:
   - a named flag per UI state (`isIdle`, `isLoading`, `isError`,
     `isEmptyResponse`, …);
   - payloads narrowed to what actually renders (`frameData: SearchPage | null`), so the View never writes null guards, status comparisons or `.length` checks of its own.
4. The View MUST NOT derive presentation values: no comparisons against
   domain constants (`STATUS`), no membership or arithmetic checks on
   Presenter data, no re-combining of raw inputs. Derivation lives in the
   Presenter; the View only composes already prepared flags when one branch
   needs several of them (`isLoading && !isSelectionLoad`).
5. The View MUST NOT import domain constants or Redux selectors to interpret
   its inputs. Raw inputs such as `status` cross the View boundary only to
   be handed to the View's own Presenter untouched.
6. Handlers arrive named and ready (`onRetry`, `clearQuery`); the View wires
   them to DOM events and MUST NOT add behavior — no debouncing, aborting,
   navigation or state writes inside the View.
7. Rendering decisions stay in the View: conditional rendering, early
   returns, component composition and a11y attributes — built from the
   prepared interface and nothing else.

#### Presenter ↔ internal hooks

1. An internal (specialized) hook exposes ONLY the values and handlers its
   consuming Presenter needs. Coordination internals — mutable refs, timers,
   raw state setters, request bookkeeping — stay private to the hook.
2. A hook receives its inputs as ONE explicit typed parameter object and
   MUST NOT reach into any other state of the consuming Presenter.
3. Behavior owned by a hook is triggered through the hook's own API, never by
   the Presenter inspecting hook internals: rules fire via callbacks
   (`onGenreUnavailable`), skipped work reports through a documented result
   (`null` = no run started), focus and abort effects run inside the hook.
4. The Presenter destructures only the fields it consumes from each hook;
   forwarding a hook's whole return object is a leak of its internals.
5. Hooks expose named handlers (`onQueryChange`, `clearQuery`), never raw
   setters (`setDraft`). A DOM handle (`inputRef`) is exposed only when the
   hook owns an effect that cannot attach it itself.
6. A Presenter-level hook MUST NOT import another component's Presenter.
   Behavior shared by several Presenters lives in a shared hook or Task at
   their nearest common ancestor.

#### Tests

A Presenter's unit suite asserts its public interface — the prepared flags
and narrowed payloads — not its internals: the interface IS the contract.
