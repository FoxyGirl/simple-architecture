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
├── <Page>.tsx                          # page component (View)
├── use<Page>.ts                        # page presenter (Presenter)
├── <Page>.module.css                   # page styles — CSS Module
├── constants.ts                        # states/constants shared by this folder
├── types.ts                            # types shared by this folder
├── utils/                              # shared pure helpers for this subtree
│   ├── index.ts                        # public export — the helpers
│   └── ...
├── index.ts                            # public export — the page component
├── components/
│   └── <SharedComponent>/              # Shared by multiple descendants (<Component1> and <Component2>)
|   ...
├── <Component1>/
│   ├── <Component1>.tsx                # component 1 (View)
│   ├── use<Component1>.ts              # component 1 presenter (Presenter)
│   ├── <Component1>.module.css         # component 1 styles — CSS Module
│   ├── index.ts                        # public export — the component
|   └── components/
│       └── <SharedComponent>/          # Shared by multiple descendants (<SubComponent1> and <SubComponent2>)
|       ...
│   └── <SubComponent1>/                # subcomponent 1 owned by Component1
│       └── SubComponent1.tsx           # subcomponent 1 (View)
│       ├── <SubComponent1>.module.css  # subcomponent 1 styles — CSS Module
│       ├── index.ts                    # public export — the subcomponent
|       ...
│   └── <SubComponent2>/                # subcomponent 2 owned by Component1
│       └── SubComponent2.tsx           # subcomponent 2 (View)
│       ├── <SubComponent2>.module.css  # subcomponent 2 styles — CSS Module
│       ├── index.ts                    # public export — the subcomponent
|       ...
├── <Component2>/
│   ├── <Component2>.tsx                # component 2 (View)
│   ├── use<Component2>.ts              # component 2 presenter (Presenter)
│   ├── <Component2>.module.css         # component 2 styles — CSS Module
│   ├── index.ts                        # public export — the component
│   └── <SubComponent>/                 # subcomponent owned by Component2
│       └── SubComponent.tsx            # subcomponent (View)
│       ├── <SubComponent>.module.css   # subcomponent styles — CSS Module
│       ├── index.ts                    # public export — the subcomponent
|       ...

```
