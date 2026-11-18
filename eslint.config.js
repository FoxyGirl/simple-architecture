import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import globals from 'globals';
import importX, { createNodeResolver } from 'eslint-plugin-import-x';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// Keep in sync with the vite/vitest/tsconfig alias and paths maps.
const aliases = {
  '@api': path.join(rootDir, 'web/src/api'),
  '@hooks': path.join(rootDir, 'web/src/hooks'),
  '@store': path.join(rootDir, 'web/src/store'),
  '~': path.join(rootDir, 'server'),
};

const nodeResolver = createNodeResolver({
  extensions: ['.js', '.jsx', '.ts', '.tsx', '.css'],
});

const aliasResolver = {
  interfaceVersion: 3,
  name: 'alias',
  resolve(modulePath, sourceFile) {
    const [alias, ...segments] = modulePath.split('/');
    const target = aliases[alias];
    // Unknown aliases fall through to the plain Node resolver.
    if (!target) return { found: false };
    return nodeResolver.resolve(path.join(target, ...segments), sourceFile);
  },
};

const unusedVars = [
  'error',
  {
    varsIgnorePattern: '^_',
    argsIgnorePattern: '^_',
    caughtErrorsIgnorePattern: '^_',
  },
];

export default defineConfig([
  // ESLint patterns are minimatch (not gitignore-style), so `**/` prefixes are
  // required to match the nested `web/dist` build output as well as `dist`.
  globalIgnores(['**/dist', '**/coverage']),
  {
    // Plain JavaScript — this config, the backend and plain-JS tooling.
    files: ['**/*.{js,jsx,mjs,cjs}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.node,
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': unusedVars,
      'max-lines': ['warn', { max: 120 }],
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat['recommended-latest'],
      react.configs.flat['jsx-runtime'],
    ],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'import-x': importX,
    },
    settings: {
      react: { version: 'detect' },
      'import-x/extensions': ['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx'],
      'import-x/resolver-next': [aliasResolver, nodeResolver],
    },
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': unusedVars,
      'max-lines': ['warn', { max: 120 }],
      'react/jsx-uses-vars': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-key': 'warn',
      'react/jsx-no-duplicate-props': 'error',
      'react/no-children-prop': 'error',
      'react/no-danger-with-children': 'error',
      'react/no-direct-mutation-state': 'error',
      'import-x/no-unresolved': 'error',
      'import-x/no-duplicates': 'warn',
      'import-x/named': 'error',
      'import-x/default': 'error',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    // The backend workspace is plain Node: same TS rules, server globals
    // instead of the browser ones assumed by the block above.
    files: ['server/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
  prettier,
]);
