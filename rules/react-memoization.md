# React Memoization Rules (Scope: `web/**/*.tsx`, `web/**/use*.ts`)

Default: Do NOT add `useCallback`, `useMemo`, or `React.memo` unless there is a concrete, measurable reason.

**Use `useCallback` ONLY when:**

- Passing a callback to a `React.memo`-wrapped child component.
- Using the function as a dependency in `useEffect`, `useMemo`, or another hook.

**Use `useMemo` ONLY when:**

- Performing an expensive calculation (e.g., heavy array filtering/sorting/mapping).
- Passing a computed object/array prop to a `React.memo` child or another hook's dependency array.

**Strict Prohibitions:**

- NEVER wrap native DOM event handlers (`onClick`, `onChange`, `onSubmit`) in `useCallback`.
- NEVER wrap primitives or simple expressions in `useMemo`.
- NEVER omit dependencies from the dependency array.
- When editing existing files, remove unnecessary `useCallback`/`useMemo` if they provide no benefit.

**Example:**

```tsx
// Bad
const handleClick = useCallback(() => setOpen(true), []);
const fullName = useMemo(() => `${first} ${last}`, [first, last]);

// Good
const handleClick = () => setOpen(true);
const fullName = `${first} ${last}`;
```
