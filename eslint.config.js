import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import globals from 'globals';
import importX, { createNodeResolver } from 'eslint-plugin-import-x';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// Keep in sync with `resolve.alias` in vite.config.js
const aliases = {
  '@api': path.join(rootDir, 'src', 'api'),
  '@hooks': path.join(rootDir, 'src', 'hooks'),
};

const nodeResolver = createNodeResolver({
  extensions: ['.js', '.jsx', '.css'],
});

const aliasResolver = {
  interfaceVersion: 3,
  name: 'alias',
  resolve(modulePath, sourceFile) {
    const [alias, ...segments] = modulePath.split('/');
    const target = aliases[alias];
    if (!target) {
      return { found: false };
    }
    return nodeResolver.resolve(path.join(target, ...segments), sourceFile);
  },
};

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
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
      'import-x/extensions': ['.js', '.jsx', '.mjs', '.cjs'],
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
      'no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
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
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      'max-lines': ['warn', { max: 120 }],
    },
  },
  prettier,
]);
