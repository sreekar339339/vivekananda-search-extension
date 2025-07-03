import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  // Source files
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        chrome: 'readonly',
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    rules: {
      // Allow console logs for extension development
      'no-console': 'off',
      // Error prevention
      'no-var': 'error',
      'prefer-const': 'error',
      'no-duplicate-imports': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Style consistency - let Prettier handle these
      // semi: ['error', 'always'],
      // quotes: ['error', 'single', { allowTemplateLiterals: true }],
      // 'comma-dangle': ['error', 'always-multiline'],
      // 'arrow-parens': ['error', 'as-needed'],
      // Performance
      'no-unused-expressions': 'error',
    },
  },
  // Test files with Node.js environment
  {
    files: ['tests/**/*.js', 'scripts/**/*.js', '*.config.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
        chrome: 'readonly',
        vi: 'readonly',
        expect: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-empty-pattern': 'warn',
    },
  },
  // Common ignores
  {
    ignores: ['node_modules/', 'dist/', 'releases/', 'build/'],
  },
];
