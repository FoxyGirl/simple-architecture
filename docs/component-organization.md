# Component Organization and Ownership

Readability, maintainability, and clear component ownership MUST take priority over minimizing the number of files.

The directory structure MUST reflect the UI component hierarchy and component ownership.

## Directory Structure

- Every application component MUST have its own directory.
- Component directories MUST follow the UI hierarchy and reflect component ownership.
- Component-specific hooks, utilities, styles, and assets SHOULD be colocated with their owning component.
- MUST NOT introduce unnecessary directory nesting that does not reflect component ownership or logical organization.

## Component Reuse and Placement

The `components/` directory at each level is reserved for reusable application components. Component placement MUST reflect its actual reuse scope.

- Components used exclusively by a single parent MUST reside directly in that parent's directory.
- Components shared within a UI subtree SHOULD reside in the `components/` directory of their nearest common ancestor.
- Components shared across unrelated UI subtrees MAY reside in the global `src/ui-kit/` directory.
- Components MUST be placed at the lowest level of the directory hierarchy that satisfies their reuse requirements.
- MUST NOT introduce shared abstractions or broaden component scope without a concrete reuse requirement.
- Reusable application components MUST follow the same View/Presenter principles as other components.

### `src/ui-kit/` — shared UI components

The global `src/ui-kit/` directory is reserved for common UI components that are reused across the whole project — `Button`, `Tooltip`, `IconButton`, form controls and similar primitives.

- MUST contain only such project-wide reusable UI components.
- MUST NOT contain application-specific components — those stay with the page or feature that owns them.
- MUST NOT be used as a place to park code without an owner; a component moves to `src/ui-kit/` only when it has a concrete cross-project reuse requirement.
- MUST follow the same View/Presenter principles as any other component: its own directory with `<Component>.jsx` + `<Component>.module.css`, and a `usePresenter<Component>.js` only when it needs behavior or data preparation.
- MUST stay presentational: no business rules and no knowledge of a specific page or feature — content, state and handlers come in through props.

```
<Page>/
├── <Page>.jsx                          # page component (View)
├── usePresenter<Page>.js               # page presenter (Presenter)
├── <Page>.module.css                   # page styles — CSS Module
├── constants.js                        # states/constants shared by this folder
├── components/
│   └── <SharedComponent>/              # Shared by multiple descendants (<Component1> and <Component2>)
|   ...
├── <Component1>/
│   ├── <Component1>.jsx                # component 1 (View)
│   ├── usePresenter<Component1>.jsx    # component 1 presenter (Presenter)
│   ├── <Component1>.module.css         # component 1 styles — CSS Module
|   └── components/
│       └── <SharedComponent>/          # Shared by multiple descendants (<SubComponent1> and <SubComponent2>)
|       ...
│   └── <SubComponent1>/                # subcomponent 1 owned by Component1
│       └── SubComponent1.jsx           # subcomponent 1 (View)
│       ├── <SubComponent1>.module.css  # subcomponent 1 styles — CSS Module
|       ...
│   └── <SubComponent2>/                # subcomponent 2 owned by Component1
│       └── SubComponent2.jsx           # subcomponent 2 (View)
│       ├── <SubComponent2>.module.css  # subcomponent 2 styles — CSS Module
|       ...
├── <Component2>/
│   ├── <Component2>.jsx                # component 2 (View)
│   ├── usePresenter<Component2>.jsx    # component 2 presenter (Presenter)
│   ├── <Component2>.module.css         # component 2 styles — CSS Module
│   └── <SubComponent>/                 # subcomponent owned by Component2
│       └── SubComponent.jsx            # subcomponent (View)
│       ├── <SubComponent>.module.css   # subcomponent styles — CSS Module
|       ...

```
