// @testing-library/jest-dom 7.x ships a `declare module 'vitest'`
// augmentation of `Assertion<T>`, but Vitest 5 renamed and reordered that
// interface to `Assertion<R, T>`, so the upstream augmentation no longer
// merges and the DOM matchers vanish from tsc (upstream issue
// testing-library/jest-dom#738, fix pending in #742; runtime is fine).
// Vitest 5 documents `Matchers<R, T>` as the extension point for custom
// matchers, so this local augmentation restores the types the same way
// jest-dom will once #742 lands. It mirrors upstream's exact type-parameter
// list so declaration merging applies, which trips three lint rules that
// only make sense for hand-written interfaces — hence the file-wide
// disables. Runtime registration lives in src/test/setup.ts (expect.extend).
/* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module 'vitest' {
  interface Matchers<
    R extends void | Promise<void>,
    T = unknown,
  > extends TestingLibraryMatchers<any, R> {}
}
