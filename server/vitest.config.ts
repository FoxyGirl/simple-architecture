import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const serverRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Mirrors the `@server/*` paths mapping in tsconfig.json; keep both in sync.
  resolve: {
    alias: {
      '@server': serverRoot,
    },
  },
  test: {
    environment: 'node',
    // Suites live in a `tests/` folder next to the code they cover:
    // server/tests for the app itself, <module>/tests for a single folder.
    include: ['**/tests/**/*.test.ts'],
  },
});
