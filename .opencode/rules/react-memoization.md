# React Memoization Rules

## General Principle

Use `useCallback` and `useMemo` only when memoization provides a measurable or meaningful benefit.

- Do NOT add memoization by default.
- Do NOT wrap every function in `useCallback`.
- Do NOT wrap every computed value in `useMemo`.
- Prefer simple, readable code over unnecessary memoization.
- Do not introduce memoization without identifying the problem it solves.

## 1. useCallback

Use `useCallback` when referential stability of a function is necessary.

**Use `useCallback` when:**

- A callback is passed as a prop to a component wrapped in `React.memo`, and keeping its reference stable can prevent unnecessary child re-renders.
- A function is used as a dependency in `useEffect`, `useMemo`, or another hook, and stabilizing its reference prevents unnecessary effect executions or recalculations.
- Referential stability is explicitly required by an API or a custom hook contract.

**Do NOT use `useCallback` when:**

- A function is used only inside the current component.
- A function is passed directly to a native DOM event handler, such as `onClick`, `onChange`, or `onSubmit`.
- A function is returned from a custom hook but its consumers do not benefit from referential stability.
- The only reason is to avoid creating a new function on every render.

Remember that `useCallback` does not prevent function execution. It preserves the function reference between renders when dependencies have not changed.

## 2. useMemo

Use `useMemo` when caching a computed value provides a meaningful benefit.

**Use `useMemo` when:**

- A calculation is computationally expensive and would otherwise be repeated on every render.
- A computed object or array is passed to a memoized child component, and preserving its reference can prevent unnecessary re-renders.
- A computed value is used as a dependency in another hook, and stable references are important to avoid unnecessary recalculations or effect executions.

**Do NOT use `useMemo` when:**

- The calculation is simple and inexpensive.
- The value is a primitive or a straightforward expression.
- The only reason is to avoid creating a new array or object without an actual downstream performance benefit.
- The result is not expensive to calculate and referential stability is not required.

Prefer calculating inexpensive values directly during rendering.

## 3. Dependencies

- Always specify complete dependency arrays.
- Include every reactive value referenced inside the memoized callback or calculation.
- Never omit dependencies to force a stable reference.
- Never suppress `react-hooks/exhaustive-deps` warnings just to avoid re-renders.
- Do not use empty dependency arrays unless the callback or calculation genuinely has no reactive dependencies.
- Follow React Hooks rules and preserve correct closure behavior.

## 4. Performance Considerations

- Consider the actual component rendering behavior before introducing memoization.
- Remember that `React.memo` compares props shallowly by default.
- Memoization is most useful when it prevents expensive calculations or unnecessary rendering of memoized components.
- Do not add `React.memo` together with `useCallback` or `useMemo` automatically. Evaluate whether the complete optimization is beneficial.
- Avoid premature optimization. If performance is not an established concern, prefer the simpler implementation.

## 5. Existing Code

When modifying existing code:

- Review existing `useCallback` and `useMemo` usage instead of preserving it automatically.
- Remove unnecessary memoization when it provides no meaningful benefit.
- Do not introduce additional memoization solely for consistency with surrounding code.
- Preserve memoization when removing it would cause unnecessary recalculations, re-renders, or behavioral changes.

## 6. React Compiler

If React Compiler is enabled in the project, follow the project's compiler configuration and conventions.

- Do not introduce manual memoization by default when the compiler already handles the optimization.
- Retain manual memoization when there is a specific requirement that is not handled by the compiler.

## 7. Decision Checklist

Before adding `useCallback` or `useMemo`, answer:

1. What specific problem does memoization solve?
2. Is referential stability actually required?
3. Does it prevent unnecessary calculations or renders?
4. Could the same result be achieved with simpler code?
5. Are all dependencies correct?

If there is no clear benefit, do not use memoization.

**Default rule: Prefer no memoization unless there is a concrete reason to introduce it.**
