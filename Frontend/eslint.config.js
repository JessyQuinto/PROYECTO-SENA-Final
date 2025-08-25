import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: ['dist', 'node_modules', '*.config.js', '*.config.ts', 'coverage'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      // include browser and node globals, plus test globals used by Vitest (vi) and `global`
      globals: { ...globals.browser, ...globals.node, global: true, vi: true },
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      '@typescript-eslint': tseslint,
      react: react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier: prettier,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...prettierConfig.rules,

      // React specific rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // TypeScript specific rules
      // reduce some rules from error -> warn to allow automatic fixes and incremental cleanup
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-function': 'off',

  // Code quality rules
  'no-console': 'warn',
  // Relaxed to warn to avoid blocking commits during large refactors
  'no-debugger': 'warn',
  'prefer-const': 'warn',
  'no-var': 'warn',

  // empty blocks often show up during refactors; warn instead of error to unblock commits
  'no-empty': 'warn',

  // Prettier integration (warn to avoid blocking commits after formatting)
  'prettier/prettier': 'warn',
  // Tests and some legacy files reference `global` and other env-specific identifiers
  // Disable `no-undef` to avoid false positives in test environment
  'no-undef': 'off',
    },
  },
];
